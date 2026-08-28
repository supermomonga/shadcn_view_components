/**
 * 2枚のPNGを pixelmatch で比較し、差分画像と差分率 JSON を出力する。
 *
 * 使い方: node compare.mjs <ours.png> <upstream.png> <diff.png> <report.json>
 * 終了コード: 差分率が閾値(第5引数、既定 0.005 = 0.5%)以下なら 0、超えたら 1。
 */
import { readFileSync, writeFileSync } from "node:fs"
import { PNG } from "pngjs"
import pixelmatch from "pixelmatch"

const [oursPath, upstreamPath, diffPath, reportPath, thresholdArg] = process.argv.slice(2)
const threshold = Number.parseFloat(thresholdArg ?? "0.005")

const ours = PNG.sync.read(readFileSync(oursPath))
const upstream = PNG.sync.read(readFileSync(upstreamPath))

if (ours.width !== upstream.width || ours.height !== upstream.height) {
  // サイズが違う時点で一致しない。共通サイズで比較し report に記録する
  const width = Math.min(ours.width, upstream.width)
  const height = Math.min(ours.height, upstream.height)
  const diff = new PNG({ width, height })
  const ratio = pixelmatch(ours.data, upstream.data, diff.data, width, height, {
    threshold: 0.1,
    includeAA: false,
  }) / (ours.width * ours.height + upstream.width * upstream.height)
  writeFileSync(diffPath, PNG.sync.write(diff))
  writeFileSync(reportPath, `${JSON.stringify({
    ratio, pass: false, sizeMismatch: true,
    ours: { width: ours.width, height: ours.height },
    upstream: { width: upstream.width, height: upstream.height },
  }, null, 2)}\n`)
  process.exit(1)
}

const diff = new PNG({ width: ours.width, height: ours.height })
const differing = pixelmatch(ours.data, upstream.data, diff.data, ours.width, ours.height, {
  threshold: 0.1,
  includeAA: false,
})
const ratio = differing / (ours.width * ours.height)
writeFileSync(diffPath, PNG.sync.write(diff))
writeFileSync(reportPath, `${JSON.stringify({ ratio, pass: ratio <= threshold, differing }, null, 2)}\n`)
process.exit(ratio <= threshold ? 0 : 1)
