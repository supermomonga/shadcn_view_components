import assert from "node:assert/strict"
import { mkdtemp, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { build } from "esbuild"
import { JSDOM } from "jsdom"

const toolRoot = path.dirname(fileURLToPath(import.meta.url))
const controllersRoot = path.join(toolRoot, "fixture/vendor/shadcn-view-components/controllers")
const temporaryRoot = await mkdtemp(path.join(tmpdir(), "shadcn-js-consumer-"))
const bundlePath = path.join(temporaryRoot, "application.mjs")

try {
  await build({
    entryPoints: [path.join(toolRoot, "fixture/application.js")],
    bundle: true,
    format: "esm",
    platform: "browser",
    outfile: bundlePath,
  })

  const expectedIdentifiers = (await readdir(controllersRoot))
    .filter((name) => name.endsWith("_controller.js"))
    .map((name) => `shadcn--${name.replace(/_controller\.js$/, "").replaceAll("_", "-")}`)
    .sort()
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  for (const name of [
    "CustomEvent",
    "DocumentFragment",
    "Element",
    "Event",
    "HTMLElement",
    "HTMLFormElement",
    "HTMLInputElement",
    "KeyboardEvent",
    "MouseEvent",
    "MutationObserver",
    "Node",
  ]) {
    globalThis[name] = dom.window[name]
  }

  const { consumerResult } = await import(pathToFileURL(bundlePath).href)

  assert.deepEqual(consumerResult.identifiers, expectedIdentifiers)
  assert.equal(consumerResult.toggleState, "on")
  assert.equal(consumerResult.togglePressed, "true")
  dom.window.close()
  process.stdout.write(`bundled ${expectedIdentifiers.length} controllers and verified toggle interaction\n`)
} finally {
  await rm(temporaryRoot, { recursive: true, force: true })
}
