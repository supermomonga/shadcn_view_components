/**
 * upstreamレジストリ取得(sync専用)。extract以降のモジュールからimport禁止 —
 * 境界は src/__tests__/boundaries.test.ts で機械検査する。
 *
 * URL構造の変更が同期コードの一点に閉じるよう、すべてのURL定義をこのファイルに集約する
 * (02-upstream-sync §2 補記)。
 */
import { access, mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { z } from "zod"

import { normalizeRegistryItem, sha256Hex, sortKeysDeep, stableJsonStringify } from "./normalize.ts"
import type { Manifest, ManifestItem, ManifestTailwindCss, UpstreamRelease } from "./manifest.ts"

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

/**
 * npm shadcn パッケージの tailwind.css。実アプリでは node_modules から解決される
 * (`@import "shadcn/tailwind.css"`)ため、バージョンは upstream_release.tag(shadcn@X.Y.Z)
 * に固定し、unpkg の不変URLから取得する(02-upstream-sync §2)。
 */
export function tailwindCssUrl(version: string): string {
  return `https://unpkg.com/shadcn@${version}/tailwind.css`
}

/** リリースタグ(shadcn@4.19.0 等)からnpmパッケージバージョンを取り出す。 */
export function versionFromReleaseTag(tag: string): string | null {
  const match = /^shadcn@(\d[^\s@]*)$/.exec(tag)
  return match?.[1] ?? null
}

export interface SyncResult {
  added: string[]
  removed: string[]
  changed: string[]
  unchanged: number
}

export interface SyncOptions {
  now?: () => Date
}

export type SyncFailureKind =
  | "network"
  | "http"
  | "not-found"
  | "invalid-json"
  | "invalid-schema"
  | "inconsistent-metadata"
  | "filesystem"
  | "commit"

/** CIログから再試行可能な通信失敗と、再試行では直らない形式不正を判別できる同期エラー。 */
export class SyncError extends Error {
  readonly retryable: boolean

  constructor(
    readonly kind: SyncFailureKind,
    readonly item: string,
    readonly file: string,
    message: string,
    options: { retryable?: boolean, snapshotUnchanged?: boolean } = {},
  ) {
    const retryable = options.retryable ?? !["invalid-json", "invalid-schema"].includes(kind)
    const snapshotState = (options.snapshotUnchanged ?? true)
      ? "; existing snapshot unchanged"
      : "; inspect the reported backup path before retrying"
    super(`[sync:${kind}] retryable=${retryable} ${item}/${file}: ${message}${snapshotState}`)
    this.name = "SyncError"
    this.retryable = retryable
  }
}

interface FetchContext {
  item: string
  file: string
}

const RegistryNameSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const RegistryIndexSchema = z.array(z.object({
  name: RegistryNameSchema,
  type: z.string(),
}).passthrough())
const RegistryFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  type: z.string().min(1),
}).passthrough()
const RegistryItemSchema = z.object({
  name: RegistryNameSchema,
  type: z.literal("registry:ui"),
  files: z.array(RegistryFileSchema).optional(),
  registryDependencies: z.array(z.string()).optional(),
}).passthrough()
const ColorsSchema = z.object({
  cssVars: z.object({
    light: z.record(z.string()),
    dark: z.record(z.string()),
  }).passthrough(),
}).passthrough()
const StyleDependenciesSchema = z.object({
  name: z.literal("index"),
  type: z.literal("registry:style"),
  dependencies: z.array(z.string()),
  devDependencies: z.array(z.string()),
}).passthrough()
const ReleaseSchema = z.object({ tag_name: z.string().min(1) }).passthrough()
const GitShaSchema = z.string().regex(/^[0-9a-f]{40}$/i)
const GitRefSchema = z.object({
  object: z.object({
    sha: GitShaSchema,
    type: z.enum(["commit", "tag"]),
    url: z.string().url().optional(),
  }).passthrough(),
}).passthrough()
const GitTagObjectSchema = z.object({
  object: z.object({ sha: GitShaSchema }).passthrough(),
}).passthrough()

function validationMessage(error: z.ZodError): string {
  return error.issues.slice(0, 3).map((issue) => {
    const location = issue.path.length > 0 ? issue.path.join(".") : "response"
    return `${location}: ${issue.message}`
  }).join("; ")
}

function validateJson<T>(schema: z.ZodType<T>, value: unknown, ctx: FetchContext): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new SyncError("invalid-schema", ctx.item, ctx.file, validationMessage(result.error))
  }
  return result.data
}

async function getJson(
  url: string,
  ctx: FetchContext,
  init?: RequestInit,
): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) })
  } catch (cause) {
    throw new SyncError("network", ctx.item, ctx.file, `request failed for ${url}: ${String(cause)}`)
  }
  if (!response.ok) {
    const kind = response.status === 404 ? "not-found" : "http"
    const retryable = response.status === 404 || response.status === 429 || response.status >= 500
    throw new SyncError(kind, ctx.item, ctx.file, `HTTP ${response.status} for ${url}`, { retryable })
  }
  try {
    return await response.json() as unknown
  } catch (cause) {
    throw new SyncError("invalid-json", ctx.item, ctx.file, `invalid JSON from ${url}: ${String(cause)}`)
  }
}

async function requireJson(url: string, ctx: FetchContext, init?: RequestInit): Promise<unknown> {
  return getJson(url, ctx, init)
}

interface RegistryIndexCapture {
  names: string[]
  content: string
  sha256: string
}

async function fetchRegistryIndex(): Promise<RegistryIndexCapture> {
  const ctx: FetchContext = { item: "index", file: "index.json" }
  const index = validateJson(RegistryIndexSchema, await requireJson(indexUrl(), ctx), ctx)
  const names = index.filter((entry) => entry.type === "registry:ui").map((entry) => entry.name).sort()
  const duplicate = names.find((name, index) => name === names[index - 1])
  if (duplicate !== undefined) {
    throw new SyncError("inconsistent-metadata", ctx.item, ctx.file, `duplicate registry:ui item '${duplicate}'`)
  }
  const content = normalizeRegistryItem(JSON.stringify(index))
  return { names, content, sha256: sha256Hex(content) }
}

/** レジストリインデックスに列挙される全 registry:ui アイテム名(ソート済み)。 */
export async function listUiItems(): Promise<string[]> {
  return (await fetchRegistryIndex()).names
}

/**
 * GitHub APIで最新releaseを解決して出所の参考情報を得る(02-upstream-sync §4 規則1)。
 * tailwind.css の不変URLをこのtagから決めるため、取得・形式検証に失敗したsnapshotは
 * 確定しない。registry本体との同一revisionは主張せず、registryは別のcontent hashで固定する。
 */
export async function resolveUpstreamRelease(checkedAt = new Date().toISOString()): Promise<UpstreamRelease> {
  const ctx: FetchContext = { item: "github", file: "releases/latest" }
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "shadcn_view_components-sync" }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const release = validateJson(
    ReleaseSchema,
    await requireJson("https://api.github.com/repos/shadcn-ui/ui/releases/latest", ctx, { headers }),
    ctx,
  )
  if (versionFromReleaseTag(release.tag_name) === null) {
    throw new SyncError(
      "inconsistent-metadata",
      ctx.item,
      ctx.file,
      `latest release tag '${release.tag_name}' does not identify an npm shadcn version`,
    )
  }
  const ref = validateJson(
    GitRefSchema,
    await requireJson(`https://api.github.com/repos/shadcn-ui/ui/git/ref/tags/${release.tag_name}`, ctx, { headers }),
    ctx,
  )
  let sha = ref.object.sha
  if (ref.object.type === "tag") {
    if (ref.object.url === undefined) {
      throw new SyncError("inconsistent-metadata", ctx.item, ctx.file, `annotated tag '${release.tag_name}' has no object URL`)
    }
    const tagObject = validateJson(GitTagObjectSchema, await requireJson(ref.object.url, ctx, { headers }), ctx)
    sha = tagObject.object.sha
  }
  return { tag: release.tag_name, resolved_sha: sha, checked_at: checkedAt }
}

export interface StyleDependencies {
  style_dependencies: string[]
  style_dev_dependencies: string[]
}

interface StyleBootstrapCapture {
  content: string
  dependencies: StyleDependencies
  sha256: string
}

/**
 * スタイル共通のnpm依存宣言を取得する。base-nova のようにアイテム毎の dependencies を
 * 持たないスタイルでは、ブートストラップアイテム(registry:style)が唯一の依存情報源。
 * snapshotの構成要素なので、取得・形式検証に失敗した場合は同期全体を失敗させる。
 */
async function captureStyleBootstrap(): Promise<StyleBootstrapCapture> {
  const ctx: FetchContext = { item: "style-index", file: "index.json" }
  const raw = await requireJson(styleIndexUrl(), ctx)
  const json = validateJson(StyleDependenciesSchema, raw, ctx)
  const content = normalizeRegistryItem(JSON.stringify(raw))
  return {
    content,
    dependencies: { style_dependencies: json.dependencies, style_dev_dependencies: json.devDependencies },
    sha256: sha256Hex(content),
  }
}

export async function fetchStyleDependencies(): Promise<StyleDependencies> {
  return (await captureStyleBootstrap()).dependencies
}

async function writeAtomic(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  const tempPath = `${filePath}.tmp`
  await writeFile(tempPath, content, "utf8")
  await rename(tempPath, filePath)
}

function sameRelease(left: UpstreamRelease | null, right: UpstreamRelease | null): boolean {
  if (left === null || right === null) return left === right
  return left.tag === right.tag && left.resolved_sha === right.resolved_sha
}

/**
 * 追跡対象の時刻は、対応するスナップショットの内容が変わった時だけ更新する。
 * 単に同じreleaseを再確認した時刻はversioned snapshotの一部にしない。
 */
export function preserveUnchangedTimestamps(candidate: Manifest, previous: Manifest | null): Manifest {
  if (previous === null) return candidate

  let next = candidate
  if (sameRelease(candidate.source.upstream_release, previous.source.upstream_release) &&
      candidate.source.upstream_release !== null && previous.source.upstream_release !== null) {
    next = {
      ...candidate,
      source: {
        ...candidate.source,
        upstream_release: {
          ...candidate.source.upstream_release,
          checked_at: previous.source.upstream_release.checked_at,
        },
      },
    }
  }

  const candidateWithoutFetchTime = { ...next, fetched_at: "" }
  const previousWithoutFetchTime = { ...previous, fetched_at: "" }
  if (JSON.stringify(candidateWithoutFetchTime) === JSON.stringify(previousWithoutFetchTime)) {
    return { ...next, fetched_at: previous.fetched_at }
  }
  return next
}

interface SnapshotItem {
  content: string
  json: z.infer<typeof RegistryItemSchema>
  origin: "upstream" | "local-override"
}

interface RemoteRegistryCapture {
  indexContent: string
  indexSha256: string
  styleContent: string
  styleSha256: string
  contentSha256: string
  items: Map<string, SnapshotItem>
  colorsContent: string
  styleDependencies: StyleDependencies
}

interface LocalOverridesCapture {
  contentSha256: string
  items: Map<string, SnapshotItem>
}

function snapshotContentSha256(
  indexSha256: string,
  items: Map<string, SnapshotItem>,
  colorsContent: string,
  styleSha256: string,
): string {
  const itemHashes = Object.fromEntries([...items.entries()].sort(([left], [right]) => left.localeCompare(right))
    .map(([name, item]) => [name, sha256Hex(item.content)]))
  return sha256Hex(stableJsonStringify(sortKeysDeep({
    index_sha256: indexSha256,
    items: itemHashes,
    style_sha256: styleSha256,
    theme_sha256: sha256Hex(colorsContent),
  })))
}

async function captureRemoteRegistry(): Promise<RemoteRegistryCapture> {
  const index = await fetchRegistryIndex()
  if (index.names.length === 0) {
    throw new SyncError("inconsistent-metadata", "index", "index.json", "registry:ui item list is empty")
  }

  const items = new Map<string, SnapshotItem>()
  for (const name of index.names) {
    const ctx: FetchContext = { item: name, file: `${name}.json` }
    const raw = await requireJson(itemUrl(name), ctx)
    const json = validateJson(RegistryItemSchema, raw, ctx)
    if (json.name !== name) {
      throw new SyncError(
        "inconsistent-metadata",
        ctx.item,
        ctx.file,
        `index requested '${name}', but response identifies '${json.name}'`,
      )
    }
    items.set(name, { content: normalizeRegistryItem(JSON.stringify(raw)), json, origin: "upstream" })
  }

  const colorsCtx: FetchContext = { item: `colors/${DEFAULT_BASE_COLOR}`, file: `${DEFAULT_BASE_COLOR}.json` }
  const colorsRaw = await requireJson(colorsUrl(DEFAULT_BASE_COLOR), colorsCtx)
  validateJson(ColorsSchema, colorsRaw, colorsCtx)
  const colorsContent = normalizeRegistryItem(JSON.stringify(colorsRaw))
  const style = await captureStyleBootstrap()

  return {
    indexContent: index.content,
    indexSha256: index.sha256,
    styleContent: style.content,
    styleSha256: style.sha256,
    contentSha256: snapshotContentSha256(index.sha256, items, colorsContent, style.sha256),
    items,
    colorsContent,
    styleDependencies: style.dependencies,
  }
}

async function captureLocalOverrides(vendorDir: string): Promise<LocalOverridesCapture> {
  const overridesDir = path.join(vendorDir, "overrides", "items")
  let filenames: string[] = []
  try {
    filenames = (await readdir(overridesDir)).filter((file) => file.endsWith(".json")).sort()
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code !== "ENOENT") throw cause
  }

  const items = new Map<string, SnapshotItem>()
  const contentHashes: Record<string, string> = {}
  for (const filename of filenames) {
    const name = filename.replace(/\.json$/, "")
    const ctx: FetchContext = { item: name, file: filename }
    const raw = await readFile(path.join(overridesDir, filename), "utf8")
    let parsed: unknown
    try {
      parsed = JSON.parse(raw) as unknown
    } catch (cause) {
      throw new SyncError("invalid-json", ctx.item, ctx.file, `invalid local override JSON: ${String(cause)}`)
    }
    const json = validateJson(RegistryItemSchema, parsed, ctx)
    if (json.name !== name) {
      throw new SyncError(
        "inconsistent-metadata",
        ctx.item,
        ctx.file,
        `override filename identifies '${name}', but content identifies '${json.name}'`,
      )
    }
    items.set(name, { content: raw, json, origin: "local-override" })
    contentHashes[name] = sha256Hex(raw)
  }
  return { contentSha256: sha256Hex(stableJsonStringify(contentHashes)), items }
}

async function fetchTailwindCss(version: string): Promise<string> {
  const ctx: FetchContext = { item: `shadcn@${version}`, file: "tailwind.css" }
  const url = tailwindCssUrl(version)
  let response: Response
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  } catch (cause) {
    throw new SyncError("network", ctx.item, ctx.file, `request failed for ${url}: ${String(cause)}`)
  }
  if (!response.ok) {
    const kind = response.status === 404 ? "not-found" : "http"
    const retryable = response.status === 429 || response.status >= 500
    throw new SyncError(kind, ctx.item, ctx.file, `HTTP ${response.status} for ${url}`, { retryable })
  }
  const raw = await response.text()
  if (raw.trim().length === 0) {
    throw new SyncError("invalid-schema", ctx.item, ctx.file, "response body is empty")
  }
  return raw.endsWith("\n") ? raw : `${raw}\n`
}

function mergeSnapshotItems(remote: RemoteRegistryCapture, overrides: LocalOverridesCapture): Map<string, SnapshotItem> {
  const items = new Map(remote.items)
  for (const [name, item] of overrides.items) {
    if (items.has(name)) process.stderr.write(`WARN: local override '${name}' shadows an upstream item\n`)
    items.set(name, item)
  }
  return items
}

function buildManifestItems(items: Map<string, SnapshotItem>): Record<string, ManifestItem> {
  const result: Record<string, ManifestItem> = {}
  for (const [name, item] of [...items.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    result[name] = {
      path: item.origin === "upstream" ? `registry/items/${name}.json` : `overrides/items/${name}.json`,
      sha256: sha256Hex(item.content),
      file_count: item.json.files?.length ?? 0,
      registry_dependencies: item.json.registryDependencies ?? [],
      origin: item.origin,
    }
  }
  return result
}

function summarizeChanges(previous: Manifest | null, items: Record<string, ManifestItem>): SyncResult {
  const added: string[] = []
  const changed: string[] = []
  let unchanged = 0
  for (const [name, item] of Object.entries(items)) {
    const before = previous?.items[name]
    if (before === undefined) added.push(name)
    else if (before.sha256 !== item.sha256 || before.origin !== item.origin) changed.push(name)
    else unchanged += 1
  }
  const removed = previous === null ? [] : Object.keys(previous.items).filter((name) => !(name in items)).sort()
  return { added, removed, changed, unchanged }
}

async function materializeSnapshot(
  stagedDir: string,
  remote: RemoteRegistryCapture,
  overrideItems: Map<string, SnapshotItem>,
  tailwindContent: string,
  manifest: Manifest,
): Promise<void> {
  for (const [name, item] of remote.items) {
    await writeAtomic(path.join(stagedDir, "registry", "items", `${name}.json`), item.content)
  }
  for (const [name, item] of overrideItems) {
    await writeAtomic(path.join(stagedDir, "overrides", "items", `${name}.json`), item.content)
  }
  await writeAtomic(path.join(stagedDir, manifest.source.registry_snapshot.index_path), remote.indexContent)
  await writeAtomic(path.join(stagedDir, manifest.source.registry_snapshot.style_path), remote.styleContent)
  await writeAtomic(path.join(stagedDir, manifest.theme.path), remote.colorsContent)
  const tailwind = manifest.source.tailwind_css
  if (tailwind === null) throw new SyncError("inconsistent-metadata", "manifest", "tailwind_css", "required entry is null")
  await writeAtomic(path.join(stagedDir, tailwind.path), tailwindContent)
  await writeAtomic(path.join(stagedDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
}

async function validateStagedSnapshot(
  stagedDir: string,
  expected: Manifest,
  remote: RemoteRegistryCapture,
): Promise<void> {
  const manifestPath = path.join(stagedDir, "manifest.json")
  const actual = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new SyncError("commit", "manifest", "manifest.json", "staged manifest does not match the validated candidate")
  }
  for (const [name, item] of Object.entries(actual.items)) {
    const content = await readFile(path.join(stagedDir, item.path), "utf8")
    if (sha256Hex(content) !== item.sha256) {
      throw new SyncError("commit", name, item.path, "staged item checksum mismatch")
    }
  }
  const theme = await readFile(path.join(stagedDir, actual.theme.path), "utf8")
  if (sha256Hex(theme) !== actual.theme.sha256) {
    throw new SyncError("commit", "theme", actual.theme.path, "staged theme checksum mismatch")
  }
  const indexContent = await readFile(path.join(stagedDir, actual.source.registry_snapshot.index_path), "utf8")
  if (sha256Hex(indexContent) !== actual.source.registry_snapshot.index_sha256) {
    throw new SyncError("commit", "index", actual.source.registry_snapshot.index_path, "staged index checksum mismatch")
  }
  const styleContent = await readFile(path.join(stagedDir, actual.source.registry_snapshot.style_path), "utf8")
  if (sha256Hex(styleContent) !== actual.source.registry_snapshot.style_sha256) {
    throw new SyncError("commit", "style-index", actual.source.registry_snapshot.style_path, "staged style checksum mismatch")
  }
  const tailwind = actual.source.tailwind_css
  if (tailwind === null) throw new SyncError("commit", "manifest", "tailwind_css", "required entry is null")
  const tailwindContent = await readFile(path.join(stagedDir, tailwind.path), "utf8")
  if (sha256Hex(tailwindContent) !== tailwind.sha256) {
    throw new SyncError("commit", "tailwind", tailwind.path, "staged Tailwind checksum mismatch")
  }
  for (const [name, item] of remote.items) {
    const content = await readFile(path.join(stagedDir, "registry", "items", `${name}.json`), "utf8")
    if (sha256Hex(content) !== sha256Hex(item.content)) {
      throw new SyncError("commit", name, `registry/items/${name}.json`, "staged remote item checksum mismatch")
    }
  }
  const stagedContentSha256 = snapshotContentSha256(
    actual.source.registry_snapshot.index_sha256,
    remote.items,
    theme,
    actual.source.registry_snapshot.style_sha256,
  )
  if (stagedContentSha256 !== actual.source.registry_snapshot.content_sha256) {
    throw new SyncError("commit", "registry", "snapshot", "staged registry content hash mismatch")
  }
}

export async function commitStagedSnapshot(
  stagedDir: string,
  vendorDir: string,
  expectedOverridesSha256?: string,
): Promise<void> {
  const backupDir = path.join(path.dirname(vendorDir), `.${path.basename(vendorDir)}.sync-backup`)
  let hasPrevious = false
  try {
    await rename(vendorDir, backupDir)
    hasPrevious = true
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code !== "ENOENT") {
      throw new SyncError("commit", "snapshot", vendorDir, `could not move existing snapshot aside: ${String(cause)}`)
    }
  }

  try {
    if (hasPrevious && expectedOverridesSha256 !== undefined) {
      const currentOverrides = await captureLocalOverrides(backupDir)
      if (currentOverrides.contentSha256 !== expectedOverridesSha256) {
        throw new SyncError("inconsistent-metadata", "overrides", "items", "local overrides changed before directory commit")
      }
    }
    await rename(stagedDir, vendorDir)
  } catch (cause) {
    if (hasPrevious) {
      try {
        await rename(backupDir, vendorDir)
      } catch (rollbackCause) {
        throw new SyncError(
          "commit",
          "snapshot",
          vendorDir,
          `commit failed (${String(cause)}) and rollback failed (${String(rollbackCause)}); previous snapshot remains at ${backupDir}`,
          { snapshotUnchanged: false },
        )
      }
    }
    if (cause instanceof SyncError) throw cause
    throw new SyncError("commit", "snapshot", vendorDir, `could not install staged snapshot: ${String(cause)}`)
  }

  if (hasPrevious) {
    try {
      await rm(backupDir, { recursive: true, force: true })
    } catch (cause) {
      process.stderr.write(`WARN: committed snapshot, but could not remove backup ${backupDir}: ${String(cause)}\n`)
    }
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === "ENOENT") return false
    throw cause
  }
}

/** 前回プロセスがdirectory交換の途中で終了していた場合、確定済みまたは旧snapshotへ収束させる。 */
async function recoverInterruptedCommit(vendorDir: string): Promise<void> {
  const parentDir = path.dirname(vendorDir)
  const basename = path.basename(vendorDir)
  const backupDir = path.join(parentDir, `.${basename}.sync-backup`)
  const [vendorExists, backupExists] = await Promise.all([pathExists(vendorDir), pathExists(backupDir)])

  if (!vendorExists && backupExists) {
    await rename(backupDir, vendorDir)
    process.stderr.write(`WARN: restored interrupted snapshot commit from ${backupDir}\n`)
  } else if (vendorExists && backupExists) {
    await rm(backupDir, { recursive: true, force: true })
    process.stderr.write(`WARN: removed backup left after a completed snapshot commit: ${backupDir}\n`)
  }

  let entries: string[] = []
  try {
    entries = await readdir(parentDir)
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code !== "ENOENT") throw cause
  }
  const stagingPrefix = `.${basename}-sync-`
  for (const entry of entries.filter((name) => name.startsWith(stagingPrefix))) {
    await rm(path.join(parentDir, entry), { recursive: true, force: true })
  }
}

/**
 * upstreamを二度取得して内容が安定していることを確認し、完成したsnapshotを同一filesystem上の
 * 一時ディレクトリで検証してからディレクトリ単位で確定する。
 */
async function performSyncVendor(vendorDir: string, options: SyncOptions): Promise<SyncResult> {
  const syncedAt = (options.now ?? (() => new Date()))().toISOString()
  await recoverInterruptedCommit(vendorDir)
  const manifestPath = path.join(vendorDir, "manifest.json")
  let previous: Manifest | null = null
  try {
    previous = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code !== "ENOENT") throw cause
  }

  const overrides = await captureLocalOverrides(vendorDir)
  const releaseBefore = await resolveUpstreamRelease(syncedAt)
  const firstCapture = await captureRemoteRegistry()
  const tailwindVersion = versionFromReleaseTag(releaseBefore.tag)
  if (tailwindVersion === null) {
    throw new SyncError("inconsistent-metadata", "github", "releases/latest", `unsupported tag '${releaseBefore.tag}'`)
  }
  const tailwindContent = await fetchTailwindCss(tailwindVersion)
  const secondCapture = await captureRemoteRegistry()
  const releaseAfter = await resolveUpstreamRelease(syncedAt)

  if (firstCapture.contentSha256 !== secondCapture.contentSha256) {
    throw new SyncError(
      "inconsistent-metadata",
      "registry",
      "snapshot",
      `content changed during sync (${firstCapture.contentSha256} -> ${secondCapture.contentSha256})`,
    )
  }
  if (!sameRelease(releaseBefore, releaseAfter)) {
    throw new SyncError(
      "inconsistent-metadata",
      "github",
      "releases/latest",
      `release changed during sync (${releaseBefore.tag}@${releaseBefore.resolved_sha} -> ${releaseAfter.tag}@${releaseAfter.resolved_sha})`,
    )
  }

  const items = mergeSnapshotItems(secondCapture, overrides)
  const manifestItems = buildManifestItems(items)
  const tailwindCss: ManifestTailwindCss = {
    package: "shadcn",
    version: tailwindVersion,
    path: "style/tailwind.css",
    sha256: sha256Hex(tailwindContent),
  }
  const candidateManifest: Manifest = {
    version: 2,
    source: {
      style: STYLE,
      registry_base_url: REGISTRY_BASE_URL,
      ...secondCapture.styleDependencies,
      registry_snapshot: {
        consistency: "double-fetch",
        index_path: "registry/index.json",
        index_sha256: secondCapture.indexSha256,
        style_path: `registry/styles/${STYLE}/index.json`,
        style_sha256: secondCapture.styleSha256,
        content_sha256: secondCapture.contentSha256,
      },
      upstream_release: releaseAfter,
      tailwind_css: tailwindCss,
    },
    fetched_at: syncedAt,
    theme: {
      base_color: DEFAULT_BASE_COLOR,
      path: `registry/colors/${DEFAULT_BASE_COLOR}.json`,
      sha256: sha256Hex(secondCapture.colorsContent),
    },
    items: manifestItems,
  }
  const manifest = preserveUnchangedTimestamps(candidateManifest, previous)
  const result = summarizeChanges(previous, manifestItems)

  await mkdir(path.dirname(vendorDir), { recursive: true })
  const stagedDir = await mkdtemp(path.join(path.dirname(vendorDir), `.${path.basename(vendorDir)}-sync-`))
  try {
    await materializeSnapshot(
      stagedDir,
      secondCapture,
      overrides.items,
      tailwindContent,
      manifest,
    )
    await validateStagedSnapshot(stagedDir, manifest, secondCapture)
    const overridesBeforeCommit = await captureLocalOverrides(vendorDir)
    if (overrides.contentSha256 !== overridesBeforeCommit.contentSha256) {
      throw new SyncError("inconsistent-metadata", "overrides", "items", "local overrides changed during sync")
    }
    await commitStagedSnapshot(stagedDir, vendorDir, overrides.contentSha256)
  } finally {
    try {
      await rm(stagedDir, { recursive: true, force: true })
    } catch (cause) {
      process.stderr.write(`WARN: could not remove staged snapshot ${stagedDir}: ${String(cause)}\n`)
    }
  }

  for (const name of result.removed) {
    process.stderr.write(`WARN: item '${name}' no longer exists in the stable upstream snapshot (removed from vendor)\n`)
  }
  return result
}

export async function syncVendor(vendorDir: string, options: SyncOptions = {}): Promise<SyncResult> {
  try {
    return await performSyncVendor(vendorDir, options)
  } catch (cause) {
    if (cause instanceof SyncError) throw cause
    throw new SyncError("filesystem", "snapshot", vendorDir, String(cause))
  }
}
