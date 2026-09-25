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
  for (let index = 0; index < png.data.length; index += 4) png.data.set(color, index)
  mutate?.(png)
  writeFileSync(path, PNG.sync.write(png))
}

const compare = (directory, ours, upstream, regions = []) => {
  const diff = join(directory, "diff.png")
  const report = join(directory, "report.json")
  const result = spawnSync(process.execPath, [COMPARE, ours, upstream, diff, report, JSON.stringify(regions)], {
    encoding: "utf8",
  })
  return { result, report: JSON.parse(readFileSync(report, "utf8")) }
}

const withImages = (context, run) => {
  const directory = mkdtempSync(join(tmpdir(), "visual-parity-compare-"))
  context.after(() => rmSync(directory, { recursive: true, force: true }))
  const ours = join(directory, "ours.png")
  const upstream = join(directory, "upstream.png")
  run(directory, ours, upstream)
}

test("accepts identical decoded RGBA pixels", (context) => withImages(context, (directory, ours, upstream) => {
  writePng(ours, 2, 1, [10, 20, 30, 40])
  writePng(upstream, 2, 1, [10, 20, 30, 40])
  const { result, report } = compare(directory, ours, upstream)
  assert.equal(result.status, 0)
  assert.equal(report.differing, 0)
}))

test("detects a one-unit change in each RGBA channel", (context) => withImages(context, (directory, ours, upstream) => {
  for (let channel = 0; channel < 4; channel += 1) {
    writePng(ours, 1, 1, [10, 20, 30, 40])
    writePng(upstream, 1, 1, [10, 20, 30, 40], (png) => { png.data[channel] += 1 })
    const { result, report } = compare(directory, ours, upstream)
    assert.equal(result.status, 1)
    assert.equal(report.unallowedDiffering, 1)
  }
}))

test("rejects a dimension mismatch even when the extra pixels have the same background", (context) => withImages(context, (directory, ours, upstream) => {
  writePng(ours, 4, 2, [10, 10, 10, 255])
  writePng(upstream, 4, 1, [10, 10, 10, 255])
  const { result, report } = compare(directory, ours, upstream, [{ x: 0, y: 1, width: 4, height: 1 }])
  assert.equal(result.status, 1)
  assert.equal(report.sizeMismatch, true)
  assert.equal(report.allowedDiffering, 4)
}))

test("allows only differences inside an explicit region", (context) => withImages(context, (directory, ours, upstream) => {
  writePng(ours, 3, 1, [10, 20, 30, 255])
  writePng(upstream, 3, 1, [10, 20, 30, 255], (png) => { png.data[0] += 1 })
  const region = [{ x: 0, y: 0, width: 1, height: 1 }]
  assert.equal(compare(directory, ours, upstream, region).report.pass, true)
  writePng(upstream, 3, 1, [10, 20, 30, 255], (png) => { png.data[4] += 1 })
  const { result, report } = compare(directory, ours, upstream, region)
  assert.equal(result.status, 1)
  assert.equal(report.allowedDiffering, 0)
  assert.equal(report.unallowedDiffering, 1)
}))
