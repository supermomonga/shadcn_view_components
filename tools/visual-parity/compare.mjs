/**
 * Compare decoded PNG dimensions and every RGBA channel exactly.
 *
 * Usage: node compare.mjs <ours.png> <upstream.png> <diff.png> <report.json> [allowed-regions-json]
 * Each allowed region is { x, y, width, height }; differences outside these
 * rectangles always fail. The coverage registry records why each region exists.
 */
import { readFileSync, writeFileSync } from "node:fs"
import { PNG } from "pngjs"

const [oursPath, upstreamPath, diffPath, reportPath, regionsArg] = process.argv.slice(2)
const allowedRegions = JSON.parse(regionsArg ?? "[]")
const ours = PNG.sync.read(readFileSync(oursPath))
const upstream = PNG.sync.read(readFileSync(upstreamPath))
const sizeMismatch = ours.width !== upstream.width || ours.height !== upstream.height
const width = Math.max(ours.width, upstream.width)
const height = Math.max(ours.height, upstream.height)

if (!Array.isArray(allowedRegions) || allowedRegions.some(({ x, y, width: w, height: h }) =>
  ![x, y, w, h].every(Number.isInteger) || x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > width || y + h > height
)) {
  throw new Error("Allowed regions must be rectangles inside the compared image")
}

const diff = new PNG({ width, height })
let differing = 0
let allowedDiffering = 0
let unallowedDiffering = 0

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const target = (y * width + x) * 4
    const oursPresent = x < ours.width && y < ours.height
    const upstreamPresent = x < upstream.width && y < upstream.height
    const oursOffset = (y * ours.width + x) * 4
    const upstreamOffset = (y * upstream.width + x) * 4
    const equal = oursPresent && upstreamPresent &&
      ours.data[oursOffset] === upstream.data[upstreamOffset] &&
      ours.data[oursOffset + 1] === upstream.data[upstreamOffset + 1] &&
      ours.data[oursOffset + 2] === upstream.data[upstreamOffset + 2] &&
      ours.data[oursOffset + 3] === upstream.data[upstreamOffset + 3]

    if (equal) {
      // Keep matching pixels faintly visible so the location of a difference is clear.
      for (let channel = 0; channel < 3; channel += 1) {
        diff.data[target + channel] = Math.round(255 * 0.8 + ours.data[oursOffset + channel] * 0.2)
      }
    } else {
      differing += 1
      const allowed = allowedRegions.some((region) =>
        x >= region.x && x < region.x + region.width && y >= region.y && y < region.y + region.height
      )
      if (allowed) allowedDiffering += 1
      else unallowedDiffering += 1
      // Red: failure. Orange: documented regional exception.
      diff.data[target] = 255
      diff.data[target + 1] = allowed ? 165 : 0
      diff.data[target + 2] = 0
    }
    diff.data[target + 3] = 255
  }
}

const pass = !sizeMismatch && unallowedDiffering === 0
writeFileSync(diffPath, PNG.sync.write(diff))
writeFileSync(reportPath, `${JSON.stringify({
  pass,
  differing,
  allowedDiffering,
  unallowedDiffering,
  ratio: differing / (width * height),
  ...(sizeMismatch
    ? { sizeMismatch: true, ours: { width: ours.width, height: ours.height }, upstream: { width: upstream.width, height: upstream.height } }
    : {}),
}, null, 2)}\n`)
process.exit(pass ? 0 : 1)
