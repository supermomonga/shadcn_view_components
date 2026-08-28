/**
 * vendor/shadcn/registry/items/*.json から upstream の .tsx ソースを
 * src/components/ui/ へ展開する。各ファイルの sha256 も検証する。
 * 決定論的: アイテム名の辞書順で処理し、出力は元ソース+改行のみ。
 *
 * 実行: pnpm run unpack  (vite build の前に自動実行される)
 * 引数付きで実行すると指定アイテムのみ展開する: node unpack.mjs button badge
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { basename, join } from "node:path"
import { createHash } from "node:crypto"

const REPO_ROOT = new URL("../../", import.meta.url).pathname
const ITEMS_DIR = join(REPO_ROOT, "vendor/shadcn/registry/items")
const OUT_DIR = join(REPO_ROOT, "tools/visual-parity/src/components/ui")

async function run() {
  const only = process.argv.slice(2)
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  let files = (await readdir(ITEMS_DIR)).filter((f) => f.endsWith(".json")).sort()
  if (only.length > 0) files = files.filter((f) => only.includes(f.replace(/\.json$/, "")))

  let count = 0
  for (const file of files) {
    const json = JSON.parse(await readFile(join(ITEMS_DIR, file), "utf8"))
    for (const entry of json.files) {
      const digest = createHash("sha256").update(entry.content, "utf8").digest("hex")
      if (entry.sha256 && digest !== entry.sha256) {
        throw new Error(`sha256 mismatch: ${file} / ${entry.path}`)
      }
      await writeFile(join(OUT_DIR, basename(entry.path)), `${entry.content}\n`, "utf8")
      count += 1
    }
  }
  console.log(`unpacked ${count} files from ${files.length} items into src/components/ui`)
}

run()
