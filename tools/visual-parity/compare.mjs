/**
 * 2枚のPNGを pixelmatch で比較し、差分画像と差分率 JSON を出力する。
 *
 * 使い方: node compare.mjs <ours.png> <upstream.png> <diff.png> <report.json> [threshold]
 * 終了コード: 差分率が閾値(既定 0.005 = 0.5%)以下なら 0、超えたら 1。
 *
 * 両画像の寸法が違う場合(bodyの高さ差など)は大きい方のキャンバスに白で
 * パディングしてから比較する。パディング領域も差分ピクセルとして数えるため、
 * 僅かな高さ差は低比率で許容され、大きな構造差は高比率で失敗する。
 */
import { readFileSync, writeFileSync } from "node:fs"
import { PNG } from "pngjs"
import pixelmatch from "pixelmatch"

const [oursPath, upstreamPath, diffPath, reportPath, thresholdArg] = process.argv.slice(2)
const threshold = Number.parseFloat(thresholdArg ?? "0.005")

const ours = PNG.sync.read(readFileSync(oursPath))
const upstream = PNG.sync.read(readFileSync(upstreamPath))
const sizeMismatch = ours.width !== upstream.width || ours.height !== upstream.height

const width = Math.max(ours.width, upstream.width)
const height = Math.max(ours.height, upstream.height)

const pad = (source) => {
  if (source.width === width && source.height === height) return source
  const canvas = new PNG({ width, height })
  // pngjs のビットマップは生成時にゼロ埋め(α=0)のため、白で塗ってから描き写す
  for (let i = 0; i < canvas.data.length; i += 4) {
    canvas.data[i] = 0xff
    canvas.data[i + 1] = 0xff
    canvas.data[i + 2] = 0xff
    canvas.data[i + 3] = 0xff
  }
  PNG.bitblt(source, canvas, 0, 0, source.width, source.height, 0, 0)
  return canvas
}

const oursPadded = pad(ours)
const upstreamPadded = pad(upstream)
const diff = new PNG({ width, height })
const differing = pixelmatch(oursPadded.data, upstreamPadded.data, diff.data, width, height, {
  threshold: 0.1,
  includeAA: false,
})
const ratio = differing / (width * height)

writeFileSync(diffPath, PNG.sync.write(diff))
writeFileSync(reportPath, `${JSON.stringify({
  ratio,
  pass: ratio <= threshold,
  differing,
  ...(sizeMismatch
    ? { sizeMismatch: true, ours: { width: ours.width, height: ours.height }, upstream: { width: upstream.width, height: upstream.height } }
    : {}),
}, null, 2)}\n`)
process.exit(ratio <= threshold ? 0 : 1)
