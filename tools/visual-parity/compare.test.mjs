import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

import { PNG } from "pngjs"

const COMPARE = fileURLToPath(new URL("./compare.mjs", import.meta.url))

const writePng = (path, width, height, color, mutate) => {
  const png = new PNG({ width, height })
  for (let index = 0; index < png.data.length; index += 4) {
    png.data[index] = color[0]
    png.data[index + 1] = color[1]
    png.data[index + 2] = color[2]
    png.data[index + 3] = color[3]
  }
  mutate?.(png)
  writeFileSync(path, PNG.sync.write(png))
}

const compare = (directory, ours, upstream) => {
  const diff = join(directory, "diff.png")
  const report = join(directory, "report.json")
  const result = spawnSync(process.execPath, [COMPARE, ours, upstream, diff, report, "0"], {
    encoding: "utf8",
  })
  return { result, report: JSON.parse(readFileSync(report, "utf8")) }
}

test("pads a size mismatch with each screenshot's background color", (context) => {
  const directory = mkdtempSync(join(tmpdir(), "visual-parity-compare-"))
  context.after(() => rmSync(directory, { recursive: true, force: true }))
  const ours = join(directory, "ours.png")
  const upstream = join(directory, "upstream.png")
  const dark = [10, 10, 10, 255]
  writePng(ours, 4, 2, dark)
  writePng(upstream, 4, 1, dark)

  const { result, report } = compare(directory, ours, upstream)

  assert.equal(result.status, 0)
  assert.equal(report.differing, 0)
  assert.equal(report.sizeMismatch, true)
})

test("keeps real content in the extra area visible", (context) => {
  const directory = mkdtempSync(join(tmpdir(), "visual-parity-compare-"))
  context.after(() => rmSync(directory, { recursive: true, force: true }))
  const ours = join(directory, "ours.png")
  const upstream = join(directory, "upstream.png")
  const dark = [10, 10, 10, 255]
  writePng(ours, 4, 2, dark, (png) => {
    const offset = 4 * 4
    png.data.set([255, 255, 255, 255], offset)
  })
  writePng(upstream, 4, 1, dark)

  const { result, report } = compare(directory, ours, upstream)

  assert.equal(result.status, 1)
  assert.equal(report.differing, 1)
})
