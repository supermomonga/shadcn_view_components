import { readFile } from "node:fs/promises"
import path from "node:path"

import type { Contract, Export } from "./contract.ts"
import { ContractSchema } from "./contract.ts"
import type { Manifest } from "./manifest.ts"
import { ParseError } from "./errors.ts"
import { resolveCnCombinations } from "./derive/combinations.ts"
import { emitContractJson } from "./emit/json.ts"
import { emitContractRuby } from "./emit/ruby.ts"
import { emitThemeCss, type ThemeTokens } from "./emit/css.ts"
import { readJsonFile, removeStaleFiles, sha256Hex } from "./normalize.ts"
import { parseTsx } from "./parse/ast.ts"
import { analyzeCn } from "./parse/cn.ts"
import { discoverExports } from "./parse/context.ts"
import { collectSlots } from "./parse/slots.ts"
import { extractCvaDefinitions } from "./parse/cva.ts"

export interface PipelinePaths {
  vendorDir: string
  genDir: string
  rubyDir: string
  cssFile: string
  configDir: string
}

export interface ExtractReport {
  contracts: Contract[]
  skipped: string[]
}

export async function loadManifest(vendorDir: string): Promise<Manifest> {
  return readJsonFile(path.join(vendorDir, "manifest.json")) as Promise<Manifest>
}

interface RegistryItemFile {
  path: string
  content?: string
  type?: string
}

interface RegistryItem {
  name: string
  files?: RegistryItemFile[]
  cssVars?: { theme?: Record<string, string>, light?: Record<string, string>, dark?: Record<string, string> } | null
  css?: string
  registryDependencies?: string[]
}

async function loadTargets(configDir: string): Promise<Set<string>> {
  const config = await readJsonFile(path.join(configDir, "targets.json")) as { items: string[] }
  return new Set(config.items)
}

async function loadNames(configDir: string): Promise<Record<string, string>> {
  return (await readJsonFile(path.join(configDir, "names.json"))) as Record<string, string>
}

/**
 * vendor スナップショットから契約を生成する(ネットワーク不使用)。
 * 解析不能なアイテムがあれば ParseError を投げる = upstreamが新しい構文を採用した場合の
 * 最初の検知点(02-upstream-sync §8)。
 */
export async function extractContracts(pipeline: PipelinePaths, only?: string[]): Promise<ExtractReport> {
  const manifest = await loadManifest(pipeline.vendorDir)
  const targets = await loadTargets(pipeline.configDir)
  const names = await loadNames(pipeline.configDir)
  const effectiveTargets = only ? new Set([...targets].filter((name) => only.includes(name))) : targets

  const contracts: Contract[] = []
  const skipped: string[] = []
  const failures: unknown[] = []

  for (const name of Object.keys(manifest.items).sort()) {
    const manifestItem = manifest.items[name]!
    if (!effectiveTargets.has(name)) {
      skipped.push(name)
      continue
    }

    const itemPath = path.join(pipeline.vendorDir, manifestItem.path)
    const content = await readFile(itemPath, "utf8")
    const normalized = content.endsWith("\n") ? content : `${content}\n`
    const actualSha = sha256Hex(normalized)
    if (actualSha !== manifestItem.sha256) {
      failures.push(new Error(`${name}: sha256 mismatch — vendor item was hand-edited (rerun rake shadcn:sync)`))
      continue
    }
    const item = JSON.parse(content) as RegistryItem

    try {
      contracts.push(await extractContractFromItem(name, item, manifestItem.sha256, names))
    } catch (error) {
      failures.push(error)
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      process.stderr.write(`ERROR: ${failure instanceof Error ? failure.message : String(failure)}\n`)
    }
    throw new ParseError(`extraction failed for ${failures.length} item(s)`, "(pipeline)", "extract", undefined)
  }

  return { contracts, skipped }
}

async function extractContractFromItem(
  name: string,
  item: RegistryItem,
  itemSha: string,
  names: Record<string, string>,
): Promise<Contract> {
  const exports: Record<string, Export> = {}

  for (const file of item.files ?? []) {
    if (!file.path?.endsWith(".tsx") || typeof file.content !== "string") continue
    const ast = parseTsx(file.content)
    const cvaDefinitions = extractCvaDefinitions(ast, name, file.path)

    for (const discovered of discoverExports(ast, name, file.path)) {
      const fnNode = discovered.functionNode
      if (!fnNode) continue // cva定義のみのエクスポート(buttonVariants等)は契約の対象外
      const slots = collectSlots(ast, fnNode, name, file.path)
      const cn = analyzeCn(ast, fnNode, cvaDefinitions, name, file.path)
      const definition = cn.cvaRef ? cvaDefinitions.get(cn.cvaRef) ?? null : null
      if (cn.cvaRef && !definition) {
        throw new ParseError(`cn() references unknown cva definition '${cn.cvaRef}'`, name, file.path)
      }

      const combinations = resolveCnCombinations(definition, cn.statics)
      const exportName = discovered.name
      exports[exportName] = {
        root_slot: slots.rootSlot,
        component_class: names[exportName] ?? `Shadcn::${exportName}`,
        cva: {
          prop_names: definition ? Object.keys(definition.variants).sort() : [],
          defaults: definition
            ? Object.fromEntries(Object.entries(definition.defaults).sort(([a], [b]) => a.localeCompare(b)))
            : {},
          compound: definition ? definition.compound : [],
        },
        combinations,
        slots: slots.slots,
        passthrough_class: cn.hasUserClass,
      }
    }
  }

  if (Object.keys(exports).length === 0) {
    throw new ParseError("no component exports with JSX found in this item", name, "(all files)")
  }

  const contract: Contract = {
    schema_version: 1,
    name,
    source: { item_sha256: itemSha },
    exports,
    css_vars: {
      light: item.cssVars?.light ?? {},
      dark: item.cssVars?.dark ?? {},
    },
    css: item.css ?? "",
    registry_dependencies: item.registryDependencies ?? [],
  }

  // 生成直後の自己検証(壊れた/悪意あるアイテムが生成物を汚染しないゲート)
  return ContractSchema.parse(contract)
}

async function loadThemeTokens(vendorDir: string, manifest: Manifest): Promise<ThemeTokens> {
  const colors = await readJsonFile(path.join(vendorDir, manifest.theme.path)) as {
    cssVars: { light?: Record<string, string>, dark?: Record<string, string> },
  }
  return { light: colors.cssVars.light ?? {}, dark: colors.cssVars.dark ?? {} }
}

export interface GenerateReport {
  contracts: Contract[]
  skipped: string[]
  files: { json: string[], ruby: string[], css: string }
  removed: { json: string[], ruby: string[] }
}

/** extract + emit(JSON / Ruby / CSS)。存在しなくなった契約に対応する生成ファイルは削除する。 */
export async function generateAll(pipeline: PipelinePaths, only?: string[]): Promise<GenerateReport> {
  const { contracts, skipped } = await extractContracts(pipeline, only)
  const manifest = await loadManifest(pipeline.vendorDir)
  const theme = await loadThemeTokens(pipeline.vendorDir, manifest)

  const jsonFiles: string[] = []
  const rubyFiles: string[] = []
  for (const contract of contracts) {
    jsonFiles.push(await emitContractJson(contract, pipeline.genDir))
    rubyFiles.push(await emitContractRuby(contract, pipeline.rubyDir))
  }
  const css = await emitThemeCss(theme, contracts, pipeline.cssFile)

  // only が指定されないフル生成のときのみ、廃止アイテムの生成物を削除する
  let removedJson: string[] = []
  let removedRuby: string[] = []
  if (!only) {
    removedJson = await removeStaleFiles(pipeline.genDir, new Set(contracts.map((contract) => `${contract.name}.json`)))
    removedRuby = await removeStaleFiles(pipeline.rubyDir, new Set(contracts.map((contract) => `${contract.name}.rb`)))
  }

  return { contracts, skipped, files: { json: jsonFiles, ruby: rubyFiles, css }, removed: { json: removedJson, ruby: removedRuby } }
}
