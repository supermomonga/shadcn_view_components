import type { Contract, Export } from "../contract.ts"
import { atomicWriteFile } from "../normalize.ts"

/**
 * lib/shadcn_view_components/generated/contracts/<name>.rb の出力
 * (03-extraction-codegen §6.1)。
 *
 * - ヘッダに「生成物であること・出所・再生成コマンド」を必ず記す
 * - rubocop -a 相当の整形を自前のemitterで保証する(外部ツール呼び出しは非決定論源)
 * - クラス文字列は折りたたまずそのまま(upstreamとのdiff対応を容易にするため)
 * - 生成物は定数のみ(実行時状態を持たない = スレッドセーフ。01-architecture §6.2)
 */

function rubyString(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
  return `"${escaped}"`
}

function rubySymbol(value: string): string {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value) ? `:${value}` : `:"${value}"`
}

/** ハッシュエントリは可能な限り Ruby のラベル記法(size: :default)で出力する。 */
function rubyHashPair(key: string, value: string): string {
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) return `${key}: ${value}`
  return `"${key}" => ${value}`
}

function rubySymbolArray(values: string[]): string {
  return `[${values.map((value) => rubySymbol(value)).join(", ")}]`
}

function rubyStringArray(values: string[]): string {
  return `[${values.map((value) => rubyString(value)).join(", ")}]`
}

/** ハッシュリテラル。空のときは "{}"、それ以外は "{ k: v, ... }"。 */
function rubyHashBody(pairs: Array<[string, string]>): string {
  if (pairs.length === 0) return "{}"
  return `{ ${pairs.map(([key, value]) => rubyHashPair(key, value)).join(", ")} }`
}

interface ModuleNode {
  name: string
  own: Export | null
  children: Map<string, ModuleNode>
}

function moduleNode(name: string): ModuleNode {
  return { name, own: null, children: new Map() }
}

/** component_class("Shadcn::Card::Header")を Contracts::Card::Header のツリー位置へ挿入する。 */
function insertExport(root: ModuleNode, exportData: Export): void {
  const parts = exportData.component_class.replace(/^Shadcn::/, "").split("::")
  let node = root
  for (const part of parts) {
    if (!node.children.has(part)) node.children.set(part, moduleNode(part))
    node = node.children.get(part)!
  }
  node.own = exportData
}

/** VARIANTS 定数用: combinations キーと compound から prop ごとの値域を復元する。 */
function variantValues(exportData: Export): Record<string, string[]> {
  const values: Record<string, string[]> = {}
  for (const prop of exportData.cva.prop_names) {
    const collected = new Set<string>()
    for (const key of Object.keys(exportData.combinations)) {
      if (key === "") continue
      for (const pair of key.split("&")) {
        const [name, value] = pair.split("=")
        if (name === prop && value !== undefined) collected.add(value)
      }
    }
    for (const compound of exportData.cva.compound) {
      const value = compound.when[prop]
      if (value !== undefined) collected.add(value)
    }
    values[prop] = [...collected].sort()
  }
  return values
}

function renderExportConstants(exportData: Export): string[] {
  const lines: string[] = []
  lines.push(`      ROOT_SLOT = T.let(${rubyString(exportData.root_slot)}, String)`)
  lines.push("")

  if (exportData.classes_slot && exportData.classes_slot !== exportData.root_slot) {
    lines.push(`      # 契約クラスが属する要素の data-slot(ルートがラッパー構造の場合)`)
    lines.push(`      CLASSES_SLOT = T.let(${rubyString(exportData.classes_slot)}, String)`)
    lines.push("")
  }

  const defaultsPairs = Object.keys(exportData.cva.defaults).sort()
    .map((key) => [key, rubySymbol(exportData.cva.defaults[key]!)] as [string, string])
  lines.push(`      DEFAULTS = T.let(${rubyHashBody(defaultsPairs)}.freeze, T::Hash[Symbol, Symbol])`)
  lines.push("")

  const variants = variantValues(exportData)
  const variantPairs = Object.keys(variants).sort()
    .map((prop) => [prop, rubySymbolArray(variants[prop]!)] as [string, string])
  lines.push(`      VARIANTS = T.let(${rubyHashBody(variantPairs)}.freeze, T::Hash[Symbol, T::Array[Symbol]])`)
  lines.push("")

  lines.push("      # キーはソート済みpropペア。値は事前解決済みの最終クラス文字列")
  const combinationEntries = Object.keys(exportData.combinations).sort().map((key) => {
    const options = key === ""
      ? "{}"
      : rubyHashBody(key.split("&").map((pair) => {
          const [prop, value] = pair.split("=")
          return [prop!, rubySymbol(value!)] as [string, string]
        }))
    return `        ${options} => ${rubyString(exportData.combinations[key]!)}`
  })
  lines.push("      COMBINATIONS = T.let({")
  lines.push(combinationEntries.join(",\n"))
  lines.push(`      }.freeze, T::Hash[T::Hash[Symbol, Symbol], String])`)
  lines.push("")

  const slotLines = exportData.slots.map((slot) => {
    const staticPairs = Object.keys(slot.static_attributes).sort()
      .map((key) => [key, rubyString(slot.static_attributes[key]!)] as [string, string])
    return `        { name: ${rubyString(slot.name)}, tag: ${rubyString(slot.tag)}, ` +
      `static_attributes: ${rubyHashBody(staticPairs)}.freeze, ` +
      `dynamic_attributes: ${rubyStringArray(slot.dynamic_attributes)}.freeze }.freeze`
  })
  lines.push("      SLOTS = T.let([")
  lines.push(slotLines.join(",\n"))
  lines.push(`      ].freeze, T::Array[T::Hash[Symbol, T.untyped]])`)
  lines.push("")
  lines.push("      extend T::Sig")
  lines.push("")
  lines.push("      sig { params(options: T::Hash[Symbol, Symbol]).returns(String) }")
  lines.push("      module_function def combination(options)")
  lines.push("        COMBINATIONS.fetch(options)")
  lines.push("      end")
  return lines
}

function renderModule(node: ModuleNode, depth: number): string {
  const indent = "  ".repeat(depth)
  const lines: string[] = []
  lines.push(`${indent}module ${node.name}`)
  if (node.own) lines.push(...renderExportConstants(node.own))
  for (const child of [...node.children.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(renderModule(child, depth + 1))
  }
  lines.push(`${indent}end`)
  return lines.join("\n")
}

export function renderContractRuby(contract: Contract): string {
  const root = moduleNode("Contracts")
  for (const exportData of Object.values(contract.exports)) {
    insertExport(root, exportData)
  }

  return [
    "# typed: strict",
    "# frozen_string_literal: true",
    "",
    "# !! AUTO-GENERATED by tools/extractor — DO NOT EDIT !!",
    `# Source: shadcn/ui new-york-v4 "${contract.name}" (item sha256: ${contract.source.item_sha256})`,
    "# Regenerate with: rake shadcn:generate",
    "",
    "module ShadcnViewComponents",
    renderModule(root, 1),
    "end",
    "",
  ].join("\n")
}

export async function emitContractRuby(contract: Contract, rubyDir: string): Promise<string> {
  const filePath = `${rubyDir}/${contract.name}.rb`
  await atomicWriteFile(filePath, renderContractRuby(contract))
  return filePath
}
