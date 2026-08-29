/**
 * vendor/shadcn のレジストリアイテム(registry/items + overrides/items)から
 * upstream の .tsx ソースを src/components/ui/ へ展開する。各ファイルの sha256 も検証する。
 * 決定論的: アイテム名の辞書順で処理し、出力は元ソース+改行のみ。
 *
 * import パスの書き換えについて: upstream の相互参照は
 * "@/registry/<style>/ui/<name>" 形式だが、shadcn CLI がホストへインストールする際にも
 * パスは書き換えられるため、ここでも展開先の "@/components/ui/<name>" へ機械的に置換する。
 * lib / hooks も同様に "@/lib/..." / "@/hooks/..." へ正規化する(vite の @ エイリアスが解決)。
 * overrides(new-york-v4 由来の form / direction)も同じ規則で通る。
 *
 * IconPlaceholder(base-nova のcreate用プレースホルダ)は
 * src/components/icon-placeholder.tsx のshim(lucide prop を実際のアイコンへ解決)へ向け、
 * 他ライブラリ選択時と同じ見た目にする。
 *
 * 実行: pnpm run unpack  (vite build の前に自動実行される)
 * 引数付きで実行すると指定アイテムのみ展開する: node unpack.mjs button badge
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { basename, join } from "node:path"
import { createHash } from "node:crypto"

const REPO_ROOT = new URL("../../", import.meta.url).pathname
const VENDOR_DIR = join(REPO_ROOT, "vendor/shadcn")
const ITEMS_DIR = join(VENDOR_DIR, "registry/items")
const OVERRIDES_DIR = join(VENDOR_DIR, "overrides/items")
const OUT_DIR = join(REPO_ROOT, "tools/visual-parity/src/components/ui")

function rewriteImports(content) {
  return content
    .replaceAll("@/app/(create)/components/icon-placeholder", "@/components/icon-placeholder")
    .replace(/@\/registry\/[a-z0-9-]+\/ui\//g, "@/components/ui/")
    .replace(/@\/registry\/[a-z0-9-]+\/hooks\//g, "@/hooks/")
    .replace(/@\/registry\/[a-z0-9-]+\/lib\//g, "@/lib/")
}

async function collectSources(only) {
  const sources = []
  for (const dir of [ITEMS_DIR, OVERRIDES_DIR]) {
    let names = []
    try {
      names = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort()
    } catch {
      continue // ディレクトリがまだ無い(overrides未使用のとき)
    }
    for (const file of names) {
      const name = file.replace(/\.json$/, "")
      // overrides が同名アイテムを shadow する(syncと同じ優先順位)
      const existing = sources.findIndex((source) => source.name === name)
      if (existing >= 0) sources.splice(existing, 1)
      sources.push({ name, path: join(dir, file) })
    }
  }
  return only.length > 0 ? sources.filter((source) => only.includes(source.name)) : sources
}

async function run() {
  const only = process.argv.slice(2)
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  const sources = await collectSources(only)
  let count = 0
  for (const source of sources) {
    const json = JSON.parse(await readFile(source.path, "utf8"))
    for (const entry of json.files) {
      const digest = createHash("sha256").update(entry.content, "utf8").digest("hex")
      if (entry.sha256 && digest !== entry.sha256) {
        throw new Error(`sha256 mismatch: ${source.name} / ${entry.path}`)
      }
      await writeFile(join(OUT_DIR, basename(entry.path)), `${rewriteImports(entry.content)}\n`, "utf8")
      count += 1
    }
  }
  console.log(`unpacked ${count} files from ${sources.length} items into src/components/ui`)
}

run()
