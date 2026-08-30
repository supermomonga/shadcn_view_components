import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

import {
  colorsUrl,
  commitStagedSnapshot,
  indexUrl,
  itemUrl,
  styleIndexUrl,
  syncVendor,
  tailwindCssUrl,
} from "../fetch.ts"
import type { Manifest } from "../manifest.ts"
import { sha256Hex, stableJsonStringify } from "../normalize.ts"

const LATEST_RELEASE_URL = "https://api.github.com/repos/shadcn-ui/ui/releases/latest"
const RELEASE_REF_BASE_URL = "https://api.github.com/repos/shadcn-ui/ui/git/ref/tags/"
const RELEASE_TAG = "shadcn@4.19.0"

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

function registryFiles(name: string): Array<{ path: string, content: string, type: string }> {
  return [{ path: `registry/base-nova/ui/${name}.tsx`, content: `export function ${name}() {}`, type: "registry:ui" }]
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

type FailureMode = "not-found" | "http" | "invalid-json" | "network"

interface MockUpstream {
  buttonLabel: string
  items: Set<string>
  releaseSha: string
  styleDependencies: unknown
  failure: { url: string, mode: FailureMode } | null
  indexCalls: number
  releaseRefCalls: number
  unstableRegistry: boolean
  unstableRelease: boolean
  unstableStyle: boolean
  onIndex: ((count: number) => Promise<void>) | null
}

function installUpstreamMock(): MockUpstream {
  const state: MockUpstream = {
    buttonLabel: "first",
    items: new Set(["button"]),
    releaseSha: "a".repeat(40),
    styleDependencies: {
      name: "index",
      type: "registry:style",
      dependencies: ["class-variance-authority"],
      devDependencies: [],
    },
    failure: null,
    indexCalls: 0,
    releaseRefCalls: 0,
    unstableRegistry: false,
    unstableRelease: false,
    unstableStyle: false,
    onIndex: null,
  }

  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
    if (state.failure?.url === url) {
      if (state.failure.mode === "network") throw new TypeError("simulated connection reset")
      if (state.failure.mode === "invalid-json") return new Response("{", { status: 200 })
      return new Response(null, { status: state.failure.mode === "not-found" ? 404 : 503 })
    }
    if (url === indexUrl()) {
      state.indexCalls += 1
      if (state.onIndex !== null) await state.onIndex(state.indexCalls)
      return jsonResponse([
        ...[...state.items].sort().map((name) => ({ name, type: "registry:ui" })),
        { name: "example", type: "registry:example" },
      ])
    }
    for (const name of state.items) {
      if (url !== itemUrl(name)) continue
      const unstableSuffix = state.unstableRegistry && state.indexCalls % 2 === 0 ? "-changed-during-sync" : ""
      return jsonResponse({
        name,
        type: "registry:ui",
        description: `${name === "button" ? state.buttonLabel : name}${unstableSuffix}`,
        files: registryFiles(name),
        registryDependencies: [],
      })
    }
    if (url === colorsUrl("neutral")) {
      return jsonResponse({ name: "neutral", cssVars: { light: {}, dark: {} } })
    }
    if (url === styleIndexUrl()) {
      if (state.unstableStyle) {
        return jsonResponse({
          ...(state.styleDependencies as Record<string, unknown>),
          css: state.indexCalls % 2 === 0 ? { changed: "second-capture" } : { changed: "first-capture" },
        })
      }
      return jsonResponse(state.styleDependencies)
    }
    if (url === LATEST_RELEASE_URL) return jsonResponse({ tag_name: RELEASE_TAG })
    if (url === `${RELEASE_REF_BASE_URL}${RELEASE_TAG}`) {
      state.releaseRefCalls += 1
      const changed = state.unstableRelease && state.releaseRefCalls % 2 === 0
      return jsonResponse({ object: { sha: changed ? "f".repeat(40) : state.releaseSha, type: "commit" } })
    }
    if (url === tailwindCssUrl(RELEASE_TAG.replace("shadcn@", ""))) {
      return new Response("@custom-variant data-open (&[data-open]);\n", { status: 200 })
    }
    return new Response(null, { status: 404 })
  }))

  return state
}

describe("syncVendor", () => {
  let testRoot: string | null = null
  let vendorDir: string

  async function prepareVendor(): Promise<void> {
    testRoot = await mkdtemp(path.join(tmpdir(), "shadcn-sync-test-"))
    vendorDir = path.join(testRoot, "vendor")
  }

  afterEach(async () => {
    vi.unstubAllGlobals()
    if (testRoot !== null) await rm(testRoot, { recursive: true, force: true })
    testRoot = null
  })

  it("keeps the snapshot byte-identical until upstream content or revision changes", async () => {
    await prepareVendor()
    const upstream = installUpstreamMock()

    await syncVendor(vendorDir, { now: () => new Date("2026-08-01T00:00:00.000Z") })
    const firstFiles = await snapshotFiles(vendorDir)
    const firstManifest = JSON.parse(firstFiles.get("manifest.json")!) as Manifest

    await syncVendor(vendorDir, { now: () => new Date("2026-08-02T00:00:00.000Z") })
    const unchangedFiles = await snapshotFiles(vendorDir)
    const unchangedManifest = JSON.parse(unchangedFiles.get("manifest.json")!) as Manifest

    expect(unchangedFiles).toEqual(firstFiles)
    expect(unchangedManifest.version).toBe(2)
    expect(unchangedManifest.source.registry_snapshot.consistency).toBe("double-fetch")
    expect(firstFiles.get(unchangedManifest.source.registry_snapshot.index_path)).toBeDefined()
    expect(firstFiles.get(unchangedManifest.source.registry_snapshot.style_path)).toBeDefined()
    expect(unchangedManifest.fetched_at).toBe("2026-08-01T00:00:00.000Z")
    expect(unchangedManifest.source.upstream_release?.checked_at).toBe("2026-08-01T00:00:00.000Z")

    upstream.buttonLabel = "changed"
    await syncVendor(vendorDir, { now: () => new Date("2026-08-03T00:00:00.000Z") })
    const contentChangedManifest = JSON.parse(await readFile(path.join(vendorDir, "manifest.json"), "utf8")) as Manifest

    expect(contentChangedManifest.fetched_at).toBe("2026-08-03T00:00:00.000Z")
    expect(contentChangedManifest.source.upstream_release?.checked_at).toBe("2026-08-01T00:00:00.000Z")
    expect(contentChangedManifest.items.button?.sha256).not.toBe(firstManifest.items.button?.sha256)
    expect(contentChangedManifest.source.registry_snapshot.content_sha256)
      .not.toBe(firstManifest.source.registry_snapshot.content_sha256)

    upstream.releaseSha = "b".repeat(40)
    await syncVendor(vendorDir, { now: () => new Date("2026-08-04T00:00:00.000Z") })
    const revisionChangedManifest = JSON.parse(await readFile(path.join(vendorDir, "manifest.json"), "utf8")) as Manifest

    expect(revisionChangedManifest.fetched_at).toBe("2026-08-04T00:00:00.000Z")
    expect(revisionChangedManifest.source.upstream_release?.checked_at).toBe("2026-08-04T00:00:00.000Z")
    expect(revisionChangedManifest.source.upstream_release?.resolved_sha).toBe(upstream.releaseSha)
  })

  it.each([
    ["index掲載itemの404", itemUrl("button"), "not-found", "not-found", true],
    ["Tailwind CSSの503", tailwindCssUrl("4.19.0"), "http", "http", true],
    ["colorsの不正JSON", colorsUrl("neutral"), "invalid-json", "invalid-json", false],
    ["style bootstrapの通信切断", styleIndexUrl(), "network", "network", true],
  ] as const)("leaves the existing snapshot unchanged on %s", async (_label, url, mode, expectedKind, retryable) => {
    await prepareVendor()
    const upstream = installUpstreamMock()
    await syncVendor(vendorDir)
    const before = await snapshotFiles(vendorDir)

    upstream.failure = { url, mode }
    await expect(syncVendor(vendorDir)).rejects.toMatchObject({ kind: expectedKind, retryable })

    expect(await snapshotFiles(vendorDir)).toEqual(before)
  })

  it("rejects schema errors without replacing dependencies with an empty fallback", async () => {
    await prepareVendor()
    const upstream = installUpstreamMock()
    await syncVendor(vendorDir)
    const before = await snapshotFiles(vendorDir)

    upstream.styleDependencies = {
      name: "index",
      type: "registry:style",
      dependencies: "not-an-array",
      devDependencies: [],
    }
    await expect(syncVendor(vendorDir)).rejects.toMatchObject({ kind: "invalid-schema", retryable: false })

    expect(await snapshotFiles(vendorDir)).toEqual(before)
  })

  it("rejects registry or release metadata that changes during the double fetch", async () => {
    await prepareVendor()
    const upstream = installUpstreamMock()
    await syncVendor(vendorDir)
    const before = await snapshotFiles(vendorDir)

    upstream.unstableRegistry = true
    await expect(syncVendor(vendorDir)).rejects.toMatchObject({ kind: "inconsistent-metadata" })
    expect(await snapshotFiles(vendorDir)).toEqual(before)

    upstream.unstableRegistry = false
    upstream.unstableStyle = true
    await expect(syncVendor(vendorDir)).rejects.toMatchObject({ kind: "inconsistent-metadata" })
    expect(await snapshotFiles(vendorDir)).toEqual(before)

    upstream.unstableStyle = false
    upstream.unstableRelease = true
    await expect(syncVendor(vendorDir)).rejects.toMatchObject({ kind: "inconsistent-metadata" })
    expect(await snapshotFiles(vendorDir)).toEqual(before)
  })

  it("removes an item only after two complete captures agree that it left the index", async () => {
    await prepareVendor()
    const upstream = installUpstreamMock()
    upstream.items.add("spinner")
    await syncVendor(vendorDir)
    expect(await readFile(path.join(vendorDir, "registry/items/spinner.json"), "utf8")).toContain('"name": "spinner"')

    upstream.items.delete("spinner")
    const result = await syncVendor(vendorDir)

    expect(result.removed).toEqual(["spinner"])
    await expect(readFile(path.join(vendorDir, "registry/items/spinner.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" })
  })

  it("preserves local override bytes on successful and failed synchronization", async () => {
    await prepareVendor()
    const upstream = installUpstreamMock()
    const override = JSON.stringify({
      name: "button",
      type: "registry:ui",
      files: registryFiles("button"),
      registryDependencies: [],
    })
    const overridePath = path.join(vendorDir, "overrides/items/button.json")
    await mkdir(path.dirname(overridePath), { recursive: true })
    await writeFile(overridePath, override, "utf8")

    await syncVendor(vendorDir)
    expect(await readFile(overridePath, "utf8")).toBe(override)
    const manifest = JSON.parse(await readFile(path.join(vendorDir, "manifest.json"), "utf8")) as Manifest
    expect(manifest.items.button?.sha256).toBe(sha256Hex(override))
    expect(await readFile(path.join(vendorDir, "registry/items/button.json"), "utf8")).toContain('"name": "button"')
    const before = await snapshotFiles(vendorDir)

    upstream.failure = { url: colorsUrl("neutral"), mode: "http" }
    await expect(syncVendor(vendorDir)).rejects.toMatchObject({ kind: "http" })
    expect(await snapshotFiles(vendorDir)).toEqual(before)
  })

  it("keeps a local override edit made during synchronization and rejects the remote update", async () => {
    await prepareVendor()
    const upstream = installUpstreamMock()
    const overridePath = path.join(vendorDir, "overrides/items/button.json")
    const before = JSON.stringify({
      name: "button",
      type: "registry:ui",
      description: "before",
      files: registryFiles("button"),
    }) + "\n"
    const edited = JSON.stringify({
      name: "button",
      type: "registry:ui",
      description: "edited",
      files: registryFiles("button"),
    }) + "\n"
    await mkdir(path.dirname(overridePath), { recursive: true })
    await writeFile(overridePath, before, "utf8")
    await syncVendor(vendorDir)

    const editAtIndexCall = upstream.indexCalls + 2
    upstream.onIndex = async (count) => {
      if (count === editAtIndexCall) await writeFile(overridePath, edited, "utf8")
    }
    await expect(syncVendor(vendorDir)).rejects.toMatchObject({ kind: "inconsistent-metadata" })

    expect(await readFile(overridePath, "utf8")).toBe(edited)
  })

  it("rolls the previous directory back when installing the staged snapshot fails", async () => {
    await prepareVendor()
    await mkdir(vendorDir, { recursive: true })
    await writeFile(path.join(vendorDir, "sentinel"), "previous\n", "utf8")
    const missingStage = path.join(testRoot!, "missing-stage")

    await expect(commitStagedSnapshot(missingStage, vendorDir)).rejects.toMatchObject({ kind: "commit" })

    expect(await readFile(path.join(vendorDir, "sentinel"), "utf8")).toBe("previous\n")
    await expect(readFile(path.join(testRoot!, ".vendor.sync-backup", "sentinel"), "utf8"))
      .rejects.toMatchObject({ code: "ENOENT" })
  })

  it("rechecks overrides after moving the current snapshot aside and rolls back a late edit", async () => {
    await prepareVendor()
    const overridePath = path.join(vendorDir, "overrides/items/button.json")
    const stagedDir = path.join(testRoot!, "staged")
    const before = JSON.stringify({
      name: "button",
      type: "registry:ui",
      description: "before",
      files: registryFiles("button"),
    })
    const edited = JSON.stringify({
      name: "button",
      type: "registry:ui",
      description: "edited immediately before commit",
      files: registryFiles("button"),
    })
    await mkdir(path.dirname(overridePath), { recursive: true })
    await writeFile(overridePath, edited, "utf8")
    await mkdir(stagedDir, { recursive: true })
    await writeFile(path.join(stagedDir, "sentinel"), "candidate\n", "utf8")
    const expectedSha256 = sha256Hex(stableJsonStringify({ button: sha256Hex(before) }))

    await expect(commitStagedSnapshot(stagedDir, vendorDir, expectedSha256))
      .rejects.toMatchObject({ kind: "inconsistent-metadata" })

    expect(await readFile(overridePath, "utf8")).toBe(edited)
    await expect(readFile(path.join(vendorDir, "sentinel"), "utf8")).rejects.toMatchObject({ code: "ENOENT" })
  })

  it("classifies local filesystem failures without changing the target", async () => {
    await prepareVendor()
    await writeFile(vendorDir, "not a directory\n", "utf8")

    await expect(syncVendor(vendorDir)).rejects.toMatchObject({ kind: "filesystem", retryable: true })

    expect(await readFile(vendorDir, "utf8")).toBe("not a directory\n")
  })

  it("restores a backup left by an interrupted directory exchange before retrying", async () => {
    await prepareVendor()
    const upstream = installUpstreamMock()
    const backupDir = path.join(testRoot!, ".vendor.sync-backup")
    const staleStage = path.join(testRoot!, ".vendor-sync-stale")
    await mkdir(backupDir, { recursive: true })
    await writeFile(path.join(backupDir, "sentinel"), "recover me\n", "utf8")
    await mkdir(staleStage, { recursive: true })
    await writeFile(path.join(staleStage, "partial"), "incomplete\n", "utf8")
    upstream.failure = { url: LATEST_RELEASE_URL, mode: "http" }

    await expect(syncVendor(vendorDir)).rejects.toMatchObject({ kind: "http" })

    expect(await readFile(path.join(vendorDir, "sentinel"), "utf8")).toBe("recover me\n")
    await expect(readFile(path.join(staleStage, "partial"), "utf8")).rejects.toMatchObject({ code: "ENOENT" })
  })
})
