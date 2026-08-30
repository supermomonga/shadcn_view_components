import { mkdtemp, readFile, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import {
  colorsUrl,
  indexUrl,
  itemUrl,
  styleIndexUrl,
  syncVendor,
  tailwindCssUrl,
} from "../fetch.ts"
import type { Manifest } from "../manifest.ts"

const LATEST_RELEASE_URL = "https://api.github.com/repos/shadcn-ui/ui/releases/latest"
const RELEASE_REF_BASE_URL = "https://api.github.com/repos/shadcn-ui/ui/git/ref/tags/"

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

async function snapshotFiles(root: string, relative = ""): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const entryPath = path.join(relative, entry.name)
    if (entry.isDirectory()) {
      for (const [name, content] of await snapshotFiles(root, entryPath)) result.set(name, content)
    } else {
      result.set(entryPath.split(path.sep).join("/"), await readFile(path.join(root, entryPath), "utf8"))
    }
  }
  return result
}

describe("syncVendor", () => {
  let vendorDir: string | null = null

  afterEach(async () => {
    vi.unstubAllGlobals()
    if (vendorDir !== null) await rm(vendorDir, { recursive: true, force: true })
  })

  it("keeps the snapshot byte-identical until upstream content or revision changes", async () => {
    vendorDir = await mkdtemp(path.join(tmpdir(), "shadcn-sync-"))
    let buttonLabel = "first"
    const releaseTag = "shadcn@4.19.0"
    let releaseSha = "a".repeat(40)

    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
      if (url === indexUrl()) {
        return jsonResponse([
          { name: "button", type: "registry:ui" },
          { name: "example", type: "registry:example" },
        ])
      }
      if (url === itemUrl("button")) {
        return jsonResponse({
          name: "button",
          type: "registry:ui",
          description: buttonLabel,
          files: [],
          registryDependencies: [],
        })
      }
      if (url === colorsUrl("neutral")) return jsonResponse({ name: "neutral", cssVars: {} })
      if (url === styleIndexUrl()) {
        return jsonResponse({ dependencies: ["class-variance-authority"], devDependencies: [] })
      }
      if (url === LATEST_RELEASE_URL) return jsonResponse({ tag_name: releaseTag })
      if (url === `${RELEASE_REF_BASE_URL}${releaseTag}`) {
        return jsonResponse({ object: { sha: releaseSha, type: "commit" } })
      }
      if (url === tailwindCssUrl(releaseTag.replace("shadcn@", ""))) {
        return new Response("@custom-variant data-open (&[data-open]);\n", { status: 200 })
      }
      return new Response(null, { status: 404 })
    }))

    await syncVendor(vendorDir, { now: () => new Date("2026-08-01T00:00:00.000Z") })
    const firstFiles = await snapshotFiles(vendorDir)
    const firstManifest = JSON.parse(firstFiles.get("manifest.json")!) as Manifest

    await syncVendor(vendorDir, { now: () => new Date("2026-08-02T00:00:00.000Z") })
    const unchangedFiles = await snapshotFiles(vendorDir)
    const unchangedManifest = JSON.parse(unchangedFiles.get("manifest.json")!) as Manifest

    expect(unchangedFiles).toEqual(firstFiles)
    expect(unchangedManifest.fetched_at).toBe("2026-08-01T00:00:00.000Z")
    expect(unchangedManifest.source.upstream_release?.checked_at).toBe("2026-08-01T00:00:00.000Z")

    buttonLabel = "changed"
    await syncVendor(vendorDir, { now: () => new Date("2026-08-03T00:00:00.000Z") })
    const contentChangedManifest = JSON.parse(await readFile(path.join(vendorDir, "manifest.json"), "utf8")) as Manifest

    expect(contentChangedManifest.fetched_at).toBe("2026-08-03T00:00:00.000Z")
    expect(contentChangedManifest.source.upstream_release?.checked_at).toBe("2026-08-01T00:00:00.000Z")
    expect(contentChangedManifest.items.button?.sha256).not.toBe(firstManifest.items.button?.sha256)

    releaseSha = "b".repeat(40)
    await syncVendor(vendorDir, { now: () => new Date("2026-08-04T00:00:00.000Z") })
    const revisionChangedManifest = JSON.parse(await readFile(path.join(vendorDir, "manifest.json"), "utf8")) as Manifest

    expect(revisionChangedManifest.fetched_at).toBe("2026-08-04T00:00:00.000Z")
    expect(revisionChangedManifest.source.upstream_release?.checked_at).toBe("2026-08-04T00:00:00.000Z")
    expect(revisionChangedManifest.source.upstream_release?.resolved_sha).toBe(releaseSha)
  })
})
