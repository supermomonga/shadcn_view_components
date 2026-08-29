import { readFile } from "node:fs/promises"
import path from "node:path"

import type { Contract, CvaDefinition, Export } from "./contract.ts"
import { ContractSchema } from "./contract.ts"
import type { Manifest } from "./manifest.ts"
import { ParseError } from "./errors.ts"
import { resolveCnCombinations, resolveConstrainedCombinations } from "./derive/combinations.ts"
import { emitContractJson } from "./emit/json.ts"
import { emitContractRuby } from "./emit/ruby.ts"
import { emitThemeCss, type ThemeTokens } from "./emit/css.ts"
import { readJsonFile, removeStaleFiles, sha256Hex, snakeCase } from "./normalize.ts"
import { parseTsx } from "./parse/ast.ts"
import { analyzeCn, type CvaOption } from "./parse/cn.ts"
import { discoverExports, type FunctionLike } from "./parse/context.ts"
import { collectSlots, returnsJsx } from "./parse/slots.ts"
import { extractCvaDefinitions } from "./parse/cva.ts"
import { rewriteUseRenderReturns } from "./parse/userender.ts"

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
      contracts.push(await extractContractFromItem(pipeline.vendorDir, manifest, name, item, manifestItem.sha256, names))
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

/** 静的なだけのサブ要素cnを、そのスロットの static_attributes["class"] に合成する。
 * 対象スロットが無い(data-slot を持たない外側ラッパー等)は、名前無しスロットとして
 * 記録する — 手書き側がラッパー構造を再現できるようにするため */
function attachSecondaryStaticClass(slots: Array<{ name: string, tag: string, static_attributes: Record<string, string>, dynamic_attributes: string[] }>, call: { slot: string, slotTag: string, statics: string[] }): void {
  const slot = slots.find((candidate) => candidate.name === call.slot)
  if (slot) {
    const existing = slot.static_attributes["class"]
    slot.static_attributes["class"] = [existing, call.statics.join(" ")].filter(Boolean).join(" ")
    return
  }
  if (call.slot === "") {
    slots.push({ name: "", tag: call.slotTag, static_attributes: { class: call.statics.join(" ") }, dynamic_attributes: [] })
  }
}

/**
 * 関数パラメータの分割代入から、バリアントpropの既定値を取り出す
 * (`{ variant = "default" }` / `{ isActive = true }`)。
 * boolean 既定値は conditional prop の既定値として使うため "true"/"false" に文字列化する
 */
function paramDefaults(fnNode: FunctionLike, cvaProps: string[]): Record<string, string> {
  const defaults: Record<string, string> = {}
  const first = fnNode.params[0]
  if (!first || first.type !== "ObjectPattern") return defaults
  for (const property of first.properties) {
    if (property.type !== "ObjectProperty") continue
    const key = property.key
    const name = key.type === "Identifier" ? key.name : key.type === "StringLiteral" ? key.value : null
    if (name === null || !cvaProps.includes(name)) continue
    const value = property.value.type === "AssignmentPattern" ? property.value.right : property.value
    if (value.type === "StringLiteral") defaults[name] = value.value
    else if (value.type === "BooleanLiteral") defaults[name] = value.value ? "true" : "false"
  }
  return defaults
}

/** 露出prop名(cvaオプションから)。passthrough はprop名、conditional は条件識別子。 */
function exposedPropNames(options: CvaOption[]): string[] {
  return options.map((option) =>
    option.kind === "passthrough" ? option.prop : option.kind === "conditional" ? option.condition : ""
  ).filter((name) => name !== "")
}

/**
 * 呼び出し側制約つきcva参照の、契約側prop名・既定値・組合せ。
 * 条件付きprop(isActive)は false 側が既定(識別子未指定 = 偽)、passthrough は
 * パラメータ既定値 ∪ cva defaultVariants(パラメータ側が優先: 実行時の上書き順)
 */
function constrainedExportProps(
  definition: CvaDefinition,
  fnNode: FunctionLike,
  options: CvaOption[],
): { propNames: string[], defaults: Record<string, string> } {
  const parameterDefaults = paramDefaults(fnNode, exposedPropNames(options))
  const defaults: Record<string, string> = {}
  for (const option of options) {
    if (option.kind === "conditional") {
      // 条件付きpropの既定値 = パラメータ既定値({ isActive = true } 等)。無ければ偽側
      defaults[snakeCase(option.condition)] = parameterDefaults[option.condition] ?? "false"
    } else if (option.kind === "passthrough") {
      const value = parameterDefaults[option.prop] ?? definition.defaults[option.prop]
      if (value !== undefined) defaults[snakeCase(option.prop)] = value
    }
  }
  return {
    propNames: exposedPropNames(options).map(snakeCase).sort(),
    defaults: Object.fromEntries(Object.entries(defaults).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
  }
}

/**
 * 非制約経路(全値域列挙)の契約側prop。
 * 実効的な既定値 = cva defaultVariants ∪ 関数パラメータの既定値(パラメータ側が優先)。
 * 実行時はパラメータ既定値が cva 呼び出しへ流れて defaultVariants を上書きするため
 * (制約付き経路の constrainedExportProps と同じ優先順位に統一)
 */
function legacyExportProps(
  definition: CvaDefinition | null,
  fnNode: FunctionLike,
  options: CvaOption[],
): { propNames: string[], defaults: Record<string, string> } {
  return {
    propNames: definition ? Object.keys(definition.variants).sort() : [],
    defaults: definition
      ? Object.fromEntries(
          Object.entries({ ...definition.defaults, ...paramDefaults(fnNode, exposedPropNames(options)) })
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        )
      : {},
  }
}

/** cva由来の露出propとガード由来の露出propを統合する */
function mergeProps(
  base: { propNames: string[], defaults: Record<string, string> },
  guardInfo: { propNames: string[], defaults: Record<string, string> } | null,
): { propNames: string[], defaults: Record<string, string> } {
  if (!guardInfo) return base
  return {
    propNames: [...new Set([...base.propNames, ...guardInfo.propNames])].sort(),
    defaults: Object.fromEntries(
      Object.entries({ ...base.defaults, ...guardInfo.defaults }).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    ),
  }
}

/**
 * enum ガード(`side === "right" && "..."`)を契約側propとして露出する。
 * 値域 = ガードに現れた値々 ∪ パラメータ既定値(既定値に対応するガードが無い
 * 場合は「追加クラスなし」の値として補完する)。既定値が静的に取れない識別子は
 * エスカレートする(既定枝だけを黙って契約化しないため)
 */
function guardExportProps(
  guards: Array<{ identifier: string, value: string, classes: string }>,
  fnNode: FunctionLike,
  item: string,
  file: string,
): { propNames: string[], defaults: Record<string, string>, guardProps: Map<string, string[]>,
    resolvedGuards: Array<{ identifier: string, value: string, classes: string }> } {
  const byIdentifier = new Map<string, Set<string>>()
  for (const guard of guards) {
    if (!byIdentifier.has(guard.identifier)) byIdentifier.set(guard.identifier, new Set())
    byIdentifier.get(guard.identifier)!.add(guard.value)
  }

  const parameterDefaults = paramDefaults(fnNode, [...byIdentifier.keys()])
  const propNames: string[] = []
  const defaults: Record<string, string> = {}
  const guardProps = new Map<string, string[]>()
  const resolvedGuards = [...guards]
  for (const [identifier, values] of byIdentifier) {
    const defaultValue = parameterDefaults[identifier]
    if (defaultValue === undefined) {
      throw new ParseError(
        `enum guard '${identifier}' has no parameter default ` +
          "(the non-default branches would be lost; add a default upstream or escalate)",
        item, file,
      )
    }
    values.add(defaultValue)
    // 既定値に対応するガード枝が無いときは「追加クラスなし」の枝として補完する
    // (select の position=item-aligned 等)
    if (![...values].every((value) => guards.some((guard) => guard.identifier === identifier && guard.value === value))) {
      resolvedGuards.push({ identifier, value: defaultValue, classes: "" })
    }
    const name = snakeCase(identifier)
    propNames.push(name)
    defaults[name] = defaultValue
    guardProps.set(name, [...values].sort())
  }
  return {
    propNames: propNames.sort(),
    defaults: Object.fromEntries(Object.entries(defaults).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
    guardProps,
    resolvedGuards,
  }
}

/** Reactコンポーネント参照タグ(大文字開始 or ドット付き)かどうか */
function isComponentTag(tag: string): boolean {
  return tag !== "" && (/^[A-Z]/.test(tag) || tag.includes("."))
}

/**
 * キャメルケースの属性名は React(JSX) の prop であって DOM 属性の名前空間には
 * 現れない(thumbAlignment 等)。data-* / aria-* はDOM属性として妥当なため除外しない。
 */
function isComponentPropName(name: string): boolean {
  return !name.startsWith("data-") && !name.startsWith("aria-") && /[A-Z]/.test(name)
}

/**
 * registryDependencies を辿って、依存アイテムが定義する cva も参照可能にする
 * (toggle-group が toggle の toggleVariants を使う等のクロスアイテム構成)。
 * 一段階のみ辿る(依存の依存は現状のupstreamに存在しない)。
 */
async function dependencyCvaDefinitions(
  item: RegistryItem,
  manifest: Manifest,
  vendorDir: string,
): Promise<Map<string, CvaDefinition>> {
  const definitions = new Map<string, CvaDefinition>()
  for (const dependency of item.registryDependencies ?? []) {
    const manifestItem = manifest.items[dependency]
    if (!manifestItem) continue
    const dependencyPath = path.join(vendorDir, manifestItem.path)
    const dependencyContent = await readFile(dependencyPath, "utf8")
    // 依存アイテムも対象アイテムと同じ手編集検知を適用する(検証なしに取り込まない)
    const normalizedDependency = dependencyContent.endsWith("\n") ? dependencyContent : `${dependencyContent}\n`
    if (sha256Hex(normalizedDependency) !== manifestItem.sha256) {
      throw new ParseError(
        `${dependency}: sha256 mismatch — vendor item was hand-edited (rerun rake shadcn:sync)`,
        "(pipeline)", "extract",
      )
    }
    const dependencyItem = JSON.parse(dependencyContent) as RegistryItem
    for (const file of dependencyItem.files ?? []) {
      if (!file.path?.endsWith(".tsx") || typeof file.content !== "string") continue
      for (const [identifier, definition] of extractCvaDefinitions(parseTsx(file.content), dependency, file.path)) {
        definitions.set(identifier, definition)
      }
    }
  }
  return definitions
}

async function extractContractFromItem(
  vendorDir: string,
  manifest: Manifest,
  name: string,
  item: RegistryItem,
  itemSha: string,
  names: Record<string, string>,
): Promise<Contract> {
  const exports: Record<string, Export> = {}
  const inheritedDefinitions = await dependencyCvaDefinitions(item, manifest, vendorDir)

  for (const file of item.files ?? []) {
    if (!file.path?.endsWith(".tsx") || typeof file.content !== "string") continue
    const ast = parseTsx(file.content)
    // base-nova の useRender パターンを従来の JSX 返却形状へ書き換えてから解析する
    rewriteUseRenderReturns(ast, name, file.path)
    const cvaDefinitions = new Map([
      ...inheritedDefinitions,
      ...extractCvaDefinitions(ast, name, file.path),
    ])

    for (const discovered of discoverExports(ast, name, file.path)) {
      const fnNode = discovered.functionNode
      if (!fnNode) continue // cva定義のみのエクスポート(buttonVariants等)は契約の対象外
      if (!returnsJsx(ast, fnNode)) continue // hooks 等、JSXを返さない出口も対象外(useFormField等)
      const slots = collectSlots(ast, fnNode, name, file.path)
      const analysis = analyzeCn(ast, fnNode, cvaDefinitions, name, file.path)

      // 主となるcn呼び出しの選別: ルート要素のもの > cvaを参照するもの >
      // data-slot を持つ要素のもの > 最初のもの。cnを一切持たないコンポーネント
      // (Accordion root 等)は空クラスとして扱う。静的なだけのサブ要素のcn
      // (switch の thumb 等)はスロットの static class に落とす
      const primary = analysis.calls.find((call) => call.slot === slots.rootSlot && slots.rootSlot !== "")
        ?? analysis.calls.find((call) => call.cvaRef !== null)
        // 利用者上書き(className)を持つ要素のcnを優先する(sidebar の container 等。
        // クラス契約は className が流れる要素に紐づくため)
        ?? analysis.calls.find((call) => call.hasUserClass && call.slot !== "" && slots.slots.some((slot) => slot.name === call.slot))
        ?? analysis.calls.find((call) => call.slot !== "" && slots.slots.some((slot) => slot.name === call.slot))
        ?? analysis.calls[0] ?? null
      for (const call of analysis.calls) {
        if (call === primary) continue
        // 主以外のcnは、そのスロットの静的クラスとして記録する。
        // className を含む場合(sidebar-container 等)は「この要素にも利用者クラスが
        // 流れる」ことを意味するが、クラス契約は主呼び出し側に紐づけるため
        // 静的側のみ採用する(手書き側が各要素に配る)
        if (call.cvaRef === null && call.statics.length > 0) {
          attachSecondaryStaticClass(slots.slots, call)
        } else {
          throw new ParseError(
            `unsupported secondary cn() call on '${call.slot || "(no data-slot)"}' ` +
              "(only fully-static secondary classes are supported)",
            name, file.path,
          )
        }
      }

      const definition = primary?.cvaRef ? cvaDefinitions.get(primary.cvaRef) ?? null : null
      if (primary?.cvaRef && !definition) {
        throw new ParseError(`cn() references unknown cva definition '${primary.cvaRef}'`, name, file.path)
      }

      // cva(...) が呼び出し側で値を制約しているとき、および enum ガード
      // (side === "right" && "...")を持つときは制約どおりの組合せを列挙する
      // (button等の全値渡しは従来の全列挙と同一の結果になる)
      const guards = primary?.guards ?? []
      const guardInfo = guards.length > 0 ? guardExportProps(guards, fnNode, name, file.path) : null
      if (guardInfo) {
        const collisions = guardInfo.propNames.filter((prop) =>
          exposedPropNames(primary?.cvaOptions ?? []).map(snakeCase).includes(prop))
        if (collisions.length > 0) {
          throw new ParseError(`guard prop collides with cva option: ${collisions.join(", ")}`, name, file.path)
        }
      }
      // cva参照を伴う呼び出しはすべて制約付き経路で解決する。
      // オプション引数を持たない(navigationMenuTriggerStyle() 等)場合は
      // 露出propなし = cva既定値のみの単一組合せになる
      const constrained = definition !== null && primary !== null && primary.cvaRef !== null
      const guarded = guardInfo !== null
      const combinations = primary && (constrained || guarded)
        ? resolveConstrainedCombinations(definition, primary.statics, primary.cvaOptions,
            guardInfo ? guardInfo.resolvedGuards : guards)
        : resolveCnCombinations(definition, primary?.statics ?? [])
      const props = primary && constrained && definition
        ? mergeProps(constrainedExportProps(definition, fnNode, primary.cvaOptions), guardInfo)
        : primary && guarded
          ? mergeProps(legacyExportProps(definition, fnNode, primary?.cvaOptions ?? []), guardInfo)
          : legacyExportProps(definition, fnNode, primary?.cvaOptions ?? [])
      const exportName = discovered.name
      exports[exportName] = {
        root_slot: slots.rootSlot,
        classes_slot: primary?.slot ?? "",
        component_class: names[exportName] ?? `Shadcn::${exportName}`,
        cva: {
          prop_names: props.propNames,
          defaults: props.defaults,
          compound: definition ? definition.compound : [],
        },
        combinations,
        slots: slots.slots,
        passthrough_class: primary?.hasUserClass ?? false,
      }
    }

    // コンポーネント参照タグ(Radixプリミティブ等)に与えられたバリアント選択は
    // React の prop であって DOM 属性にはならない(variant="outline" 等はクラスに現れる)。
    // DOM契約に混入しないよう、cva の prop 名と一致する静的属性を取り除く。
    // 同様にキャメルケースprop(slider の thumbAlignment 等Base UI固有prop)も
    // DOM属性ではないため取り除く(data-* / aria-* は除く)
    const cvaPropNames = new Set([...cvaDefinitions.values()].flatMap((definition) => Object.keys(definition.variants)))
    for (const exportData of Object.values(exports)) {
      for (const slot of exportData.slots) {
        if (!isComponentTag(slot.tag)) continue
        for (const prop of Object.keys(slot.static_attributes)) {
          if (prop !== "class" && (cvaPropNames.has(prop) || isComponentPropName(prop))) {
            delete slot.static_attributes[prop]
          }
        }
      }
    }
  }

  // ルートが子コンポーネント経由で描かれるエクスポート(PaginationPrevious 等)は、
  // 同一アイテム内の兄弟エクスポート(PaginationLink)のルートスロットを継承する。
  // upstream のDOMは子コンポーネントのルート要素(<a data-slot="pagination-link">)になる。
  // 自分のJSX内に data-slot 要素を持つ場合(alert-dialog-content が overlay+content を
  // 含む等)は継承しない — その要素群がこのエクスポートの描画結果になる
  // A→B→C の連鎖で処理順により継承が漏れないよう、変化がなくなるまで反復する
  let changed = true
  while (changed) {
    changed = false
    for (const exportData of Object.values(exports)) {
      if (exportData.root_slot !== "") continue
      if (!exportData.slots.every((slot) => slot.name === "")) continue
      const childRefTag = exportData.slots.find((slot) => slot.name === "")?.tag ?? ""
      const sibling = exports[childRefTag]
      if (!sibling || sibling === exportData || sibling.root_slot === "") continue
      exportData.root_slot = sibling.root_slot
      exportData.slots = structuredClone(sibling.slots)
      changed = true
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
    rubyFiles.push(await emitContractRuby(contract, pipeline.rubyDir, manifest.source.style))
  }
  const css = await emitThemeCss(theme, contracts, pipeline.cssFile, manifest.source.style)

  // only が指定されないフル生成のときのみ、廃止アイテムの生成物を削除する
  let removedJson: string[] = []
  let removedRuby: string[] = []
  if (!only) {
    removedJson = await removeStaleFiles(pipeline.genDir, new Set(contracts.map((contract) => `${contract.name}.json`)))
    removedRuby = await removeStaleFiles(pipeline.rubyDir, new Set(contracts.map((contract) => `${contract.name}.rb`)))
  }

  return { contracts, skipped, files: { json: jsonFiles, ruby: rubyFiles, css }, removed: { json: removedJson, ruby: removedRuby } }
}
