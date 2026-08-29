/**
 * upstreamレジストリ取得(sync専用)。extract以降のモジュールからimport禁止 —
 * 境界は src/__tests__/boundaries.test.ts で機械検査する。
 *
 * URL構造の変更が同期コードの一点に閉じるよう、すべてのURL定義をこのファイルに集約する
 * (02-upstream-sync §2 補記)。
 */
import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { normalizeRegistryItem, sha256Hex } from "./normalize.ts"
import type { Manifest, ManifestItem, UpstreamRelease } from "./manifest.ts"

export const REGISTRY_BASE_URL = "https://ui.shadcn.com/r"
export const STYLE = "base-nova"
export const DEFAULT_BASE_COLOR = "neutral"

export function indexUrl(): string {
  return `${REGISTRY_BASE_URL}/index.json`
}

export function itemUrl(name: string): string {
  return `${REGISTRY_BASE_URL}/styles/${STYLE}/${name}.json`
}

/** スタイルのブートストラップアイテム(registry:style)。スタイル共通のnpm依存宣言の情報源。 */
export function styleIndexUrl(): string {
  return `${REGISTRY_BASE_URL}/styles/${STYLE}/index.json`
}

export function colorsUrl(baseColor: string): string {
  return `${REGISTRY_BASE_URL}/colors/${baseColor}.json`
}

export interface SyncResult {
  added: string[]
  removed: string[]
  changed: string[]
  unchanged: number
}

interface FetchContext {
  item: string
  file: string
}

async function getJson(
  url: string,
  ctx: FetchContext,
  init?: RequestInit,
): Promise<{ status: number, json: unknown }> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) })
  if (!response.ok) {
    return { status: response.status, json: null }
  }
  const json: unknown = await response.json().catch((cause) => {
    throw new Error(`${ctx.item}/${ctx.file}: invalid JSON from ${url}: ${String(cause)}`)
  })
  return { status: response.status, json }
}

async function requireJson(url: string, ctx: FetchContext, init?: RequestInit): Promise<unknown> {
  const { status, json } = await getJson(url, ctx, init)
  if (json === null) {
    throw new Error(`${ctx.item}/${ctx.file}: HTTP ${status} for ${url}`)
  }
  return json
}

interface RegistryIndexEntry {
  name: string
  type: string
}

/** レジストリインデックスに列挙される全 registry:ui アイテム名(ソート済み)。 */
export async function listUiItems(): Promise<string[]> {
  const ctx: FetchContext = { item: "index", file: "index.json" }
  const index = (await requireJson(indexUrl(), ctx)) as RegistryIndexEntry[]
  if (!Array.isArray(index)) throw new Error("index.json: expected an array")
  return index.filter((e) => e.type === "registry:ui").map((e) => e.name).sort()
}

/**
 * GitHub APIで最新releaseを解決して出所の参考情報を得る(02-upstream-sync §4 規則1)。
 * ロックの本体はitems.*.sha256であり、ここは参考情報にすぎないため、
 * 失敗時は警告の上 null で続行する(レート制限等)。
 */
export async function resolveUpstreamRelease(): Promise<UpstreamRelease | null> {
  const ctx: FetchContext = { item: "github", file: "releases/latest" }
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "shadcn_view_components-sync" }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  try {
    const release = (await requireJson("https://api.github.com/repos/shadcn-ui/ui/releases/latest", ctx, { headers })) as {
      tag_name: string
    }
    const ref = (await requireJson(`https://api.github.com/repos/shadcn-ui/ui/git/ref/tags/${release.tag_name}`, ctx, { headers })) as {
      object: { sha: string, type: string, url?: string },
    }
    let sha = ref.object.sha
    if (ref.object.type === "tag" && ref.object.url) {
      const tagObject = (await requireJson(ref.object.url, ctx, { headers })) as { object: { sha: string } }
      sha = tagObject.object.sha
    }
    return { tag: release.tag_name, resolved_sha: sha, checked_at: new Date().toISOString() }
  } catch (error) {
    process.stderr.write(`WARN: could not resolve upstream release metadata: ${String(error)}\n`)
    return null
  }
}

export interface StyleDependencies {
  style_dependencies: string[]
  style_dev_dependencies: string[]
}

/**
 * スタイル共通のnpm依存宣言を取得する。base-nova のようにアイテム毎の dependencies を
 * 持たないスタイルでは、ブートストラップアイテム(registry:style)が唯一の依存情報源。
 * 参考情報であり失敗時は警告して空配列で続行する(ロックの本体は items.*.sha256)。
 */
export async function fetchStyleDependencies(): Promise<StyleDependencies> {
  const ctx: FetchContext = { item: "style-index", file: "index.json" }
  try {
    const json = (await requireJson(styleIndexUrl(), ctx)) as {
      dependencies?: string[]
      devDependencies?: string[]
    }
    return { style_dependencies: json.dependencies ?? [], style_dev_dependencies: json.devDependencies ?? [] }
  } catch (error) {
    process.stderr.write(`WARN: could not fetch the style bootstrap item (reference info only): ${String(error)}\n`)
    return { style_dependencies: [], style_dev_dependencies: [] }
  }
}

async function writeAtomic(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  const tempPath = `${filePath}.tmp`
  await writeFile(tempPath, content, "utf8")
  await rename(tempPath, filePath)
}

/**
 * vendorスナップショットを更新する。全アイテム取得が成功してから一括で書き込む
 * (アトミック性。部分更新で終わらせない — 02-upstream-sync §5.1)。
 */
export async function syncVendor(vendorDir: string): Promise<SyncResult> {
  const itemsDir = path.join(vendorDir, "registry", "items")
  const overridesDir = path.join(vendorDir, "overrides", "items")
  const colorsPath = path.join(vendorDir, "registry", "colors", `${DEFAULT_BASE_COLOR}.json`)
  const manifestPath = path.join(vendorDir, "manifest.json")

  const upstreamNames = await listUiItems()

  // 既存manifest(差分サマリ用)と既存オーバーライドを読む
  let previous: Manifest | null = null
  try {
    previous = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest
  } catch {
    previous = null
  }
  let overrideNames: string[] = []
  try {
    overrideNames = (await readdir(overridesDir)).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort()
  } catch {
    overrideNames = []
  }

  // (1) 全アイテムをメモリに取得(1件でも失敗したら書き込まず非ゼロexit)。
  //     ただしインデックスに列挙されているのにupstreamが404を返すアイテムは
  //     「upstream側の不整合」として警告付きスキップする。
  const fetched = new Map<string, { content: string, json: Record<string, unknown>, origin: "upstream" | "local-override" }>()
  for (const name of upstreamNames) {
    const ctx: FetchContext = { item: name, file: `${name}.json` }
    const { status, json } = await getJson(itemUrl(name), ctx)
    if (json === null) {
      if (status === 404) {
        process.stderr.write(`WARN: '${name}' is listed in the registry index but upstream returns 404 — skipped\n`)
        continue
      }
      throw new Error(`${name}/${name}.json: HTTP ${status} for ${itemUrl(name)}`)
    }
    fetched.set(name, { content: normalizeRegistryItem(JSON.stringify(json)), json: json as Record<string, unknown>, origin: "upstream" })
  }

  // (2) テーマ(デフォルトbase color)。2026年のレジストリでは cssVars はUIアイテムから
  //     colorsエンドポイントに分離しているため、テーマもスナップショットに含める。
  const colorsCtx: FetchContext = { item: `colors/${DEFAULT_BASE_COLOR}`, file: `${DEFAULT_BASE_COLOR}.json` }
  const colorsJson = (await requireJson(colorsUrl(DEFAULT_BASE_COLOR), colorsCtx)) as Record<string, unknown>
  const colorsContent = normalizeRegistryItem(JSON.stringify(colorsJson))

  // (3) オーバーライドをマージ(同名のupstreamアイテムがあれば警告してオーバーライド優先)
  for (const name of overrideNames) {
    const filePath = path.join(overridesDir, `${name}.json`)
    const raw = await readFile(filePath, "utf8")
    if (fetched.has(name)) {
      process.stderr.write(`WARN: local override '${name}' shadows an upstream item\n`)
    }
    fetched.set(name, { content: normalizeRegistryItem(raw), json: JSON.parse(raw) as Record<string, unknown>, origin: "local-override" })
  }

  // (4) 一括書き込み + 廃止検知(インデックスから消えたアイテムの削除)
  const added: string[] = []
  const changed: string[] = []
  let unchanged = 0
  const items: Record<string, ManifestItem> = {}
  for (const name of [...fetched.keys()].sort()) {
    const entry = fetched.get(name)!
    const isOverride = entry.origin === "local-override"
    const filePath = isOverride ? path.join(overridesDir, `${name}.json`) : path.join(itemsDir, `${name}.json`)
    const relativePath = path.relative(vendorDir, filePath)
    const files = (entry.json["files"] as Array<unknown> | undefined) ?? []
    const registryDeps = (entry.json["registryDependencies"] as Array<string> | undefined) ?? []
    items[name] = {
      path: relativePath.split(path.sep).join("/"),
      sha256: sha256Hex(entry.content),
      file_count: files.length,
      registry_dependencies: registryDeps,
      origin: entry.origin,
    }
    const before = previous?.items[name]
    if (!before) {
      added.push(name)
    } else if (before.sha256 !== items[name]!.sha256) {
      changed.push(name)
    } else {
      unchanged += 1
    }
    // オーバーライドはユーザー管理ファイルなので上書きしない
    if (!isOverride) await writeAtomic(filePath, entry.content)
  }

  const removed: string[] = []
  try {
    const existing = await readdir(itemsDir)
    for (const file of existing.filter((f) => f.endsWith(".json"))) {
      const name = file.replace(/\.json$/, "")
      if (!fetched.has(name) || fetched.get(name)!.origin !== "upstream") {
        removed.push(name)
        await rm(path.join(itemsDir, file))
        process.stderr.write(`WARN: item '${name}' no longer exists in the upstream index (removed from vendor)\n`)
      }
    }
  } catch {
    // items ディレクトリがまだ無いだけ
  }

  await writeAtomic(colorsPath, colorsContent)

  const manifest: Manifest = {
    version: 1,
    source: {
      style: STYLE,
      registry_base_url: REGISTRY_BASE_URL,
      ...await fetchStyleDependencies(),
      upstream_release: await resolveUpstreamRelease(),
    },
    fetched_at: new Date().toISOString(),
    theme: {
      base_color: DEFAULT_BASE_COLOR,
      path: path.relative(vendorDir, colorsPath).split(path.sep).join("/"),
      sha256: sha256Hex(colorsContent),
    },
    items,
  }
  await writeAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  return { added, removed, changed, unchanged }
}
