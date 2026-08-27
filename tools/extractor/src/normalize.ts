import { createHash } from "node:crypto"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

/**
 * 決定論的整形規則の集約(03-extraction-codegen §7)。
 * 各emitterは必ずここを通す。タイムスタンプ・乱数・cwd・環境変数・mtimeを
 * 出力に反映することは禁止(入力由来の sha256 のみ可)。
 */

/** plain object のキーを再帰的に辞書順ソートしたコピーを返す。配列は順序維持。 */
export function sortKeysDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((element) => sortKeysDeep(element)) as unknown as T
  }
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(source).sort()) {
      result[key] = sortKeysDeep(source[key])
    }
    return result as unknown as T
  }
  return value
}

/** 2スペースインデント + LF + 末尾改行。 */
export function stableJsonStringify(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

/** vendor スナップショット保存用の正規化(02-upstream-sync §4 規則5)。 */
export function normalizeRegistryItem(raw: string): string {
  return stableJsonStringify(JSON.parse(raw))
}

export function sha256Hex(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex")
}

/** 組み合わせキー: "prop=value" をprop名でソートして "&" 連結。 */
export function combinationKey(options: Record<string, string>): string {
  return Object.keys(options)
    .sort()
    .map((prop) => `${prop}=${options[prop]!}`)
    .join("&")
}

/** アトミック書き込み(一時ファイル→rename)。中断時に中途半端な生成物を残さない。 */
export async function atomicWriteFile(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  const tempPath = `${filePath}.tmp`
  await writeFile(tempPath, content, "utf8")
  await rename(tempPath, filePath)
}

/** outDir 配下で、keep に含まれない生成ファイルを削除(upstream廃止の生成物への反映)。 */
export async function removeStaleFiles(outDir: string, keep: Set<string>): Promise<string[]> {
  const { readdir } = await import("node:fs/promises")
  let removed: string[] = []
  try {
    removed = (await readdir(outDir)).filter((f) => f.endsWith(".rb") || f.endsWith(".json"))
      .filter((f) => !keep.has(f))
  } catch {
    return []
  }
  for (const file of removed) {
    await rm(path.join(outDir, file))
  }
  return removed
}

export async function readJsonFile(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, "utf8"))
}
