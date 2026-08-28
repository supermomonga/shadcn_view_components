import { cva } from "class-variance-authority"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import type { CvaDefinition } from "../contract.ts"
import { combinationKey, snakeCase } from "../normalize.ts"
import type { CvaOption } from "../parse/cn.ts"

/** 組み合わせ爆発のガード(03-extraction-codegen §8)。超えたら例外で打ち切り、個別対応へエスカレーション。 */
export const MAX_COMBINATIONS = 1024

export function enumerateCombinations(variants: Record<string, Record<string, string>>): Array<Record<string, string>> {
  let combinations: Array<Record<string, string>> = [{}]
  for (const prop of Object.keys(variants).sort()) {
    const values = Object.keys(variants[prop]!).sort()
    if (values.length === 0) continue
    combinations = combinations.flatMap((current) => values.map((value) => ({ ...current, [prop]: value })))
    if (combinations.length > MAX_COMBINATIONS) {
      throw new Error(
        `variant combination explosion: ${combinations.length} > ${MAX_COMBINATIONS} ` +
          "(escalate with tools/extractor/config/overrides.json)",
      )
    }
  }
  return combinations
}

/**
 * このパイプラインの核心(03-extraction-codegen §5)。
 * バリアントの全組み合わせを列挙し、upstreamと同一の cva + tailwind-merge を
 * Node上で実行して最終クラス文字列を事前解決する。
 * Rubyランタイムは辞書引きするだけになる。
 *
 * クラスの連結順は upstream の cn(...) と同じ「cva出力 → 静的クラス列」順を維持する。
 * tailwind-merge は後勝ちのため、静的クラスを cva base 側に繰り込むと
 * 競合時の勝者が実機と逆転する(toggle-group の px-3 欠落が実例)
 */
export function resolveCnCombinations(definition: CvaDefinition | null, statics: string[]): Record<string, string> {
  const resolver = cva(definition?.base ?? "", {
    variants: definition?.variants ?? {},
    compoundVariants: definition?.compound.map((entry) => ({ ...entry.when, class: entry.class })) ?? [],
    defaultVariants: definition?.defaults ?? {},
  })

  const combinations = definition ? enumerateCombinations(definition.variants) : [{}]
  const resolved: Record<string, string> = {}
  for (const combination of combinations) {
    const value = twMerge(clsx(resolver(combination), statics.join(" ")))
    const key = combinationKey(combination)
    if (key in resolved) continue // 同一キーの重複(理論上ない)は最初を採用
    resolved[key] = value
  }
  return resolved
}

/** 露出する契約側prop(列挙値域と、cva呼び出しへの引数写像を持つ) */
interface ExposedProp {
  name: string
  values: string[]
  cvaArgs: Array<Record<string, string>>
}

/**
 * cn 内の `cva({...})` が呼び出し側で値を制約している構成(pagination 等)。
 * passthrough prop は全値域、条件付きprop(`isActive ? "outline" : "ghost"`)は
 * 条件識別子を true/false の2値として列挙し、fixed prop は全組み合わせに定数適用する。
 * 露出prop名は snake_case で契約化する(Ruby kwargs との対応のため)
 */
export function resolveConstrainedCombinations(
  definition: CvaDefinition,
  statics: string[],
  options: CvaOption[],
): Record<string, string> {
  const fixedArgs: Record<string, string> = {}
  const exposed: ExposedProp[] = []
  for (const option of options) {
    switch (option.kind) {
      case "fixed":
        fixedArgs[option.prop] = option.value
        break
      case "passthrough": {
        const values = Object.keys(definition.variants[option.prop] ?? {}).sort()
        if (values.length === 0) {
          throw new Error(`passthrough cva prop '${option.prop}' does not exist in '${definition.identifier}'`)
        }
        exposed.push({
          name: snakeCase(option.prop),
          values,
          cvaArgs: values.map((value) => ({ [option.prop]: value })),
        })
        break
      }
      case "conditional":
        exposed.push({
          name: snakeCase(option.condition),
          values: ["true", "false"],
          cvaArgs: [{ [option.prop]: option.trueValue }, { [option.prop]: option.falseValue }],
        })
        break
    }
  }

  const resolver = cva(definition.base, {
    variants: definition.variants,
    compoundVariants: definition.compound.map((entry) => ({ ...entry.when, class: entry.class })),
    defaultVariants: definition.defaults,
  })

  let combinations: Array<Record<string, string>> = [{}] // 契約側の組合せ(露出propの値)
  for (const prop of exposed) {
    combinations = combinations.flatMap((current) =>
      prop.values.map((value) => ({ ...current, [prop.name]: value }))
    )
    if (combinations.length > MAX_COMBINATIONS) {
      throw new Error(`variant combination explosion: ${combinations.length} > ${MAX_COMBINATIONS}`)
    }
  }

  const resolved: Record<string, string> = {}
  for (const combination of combinations) {
    // 契約側の組合せ値を cva 呼び出し引数へ写像して解決する
    const args: Record<string, string> = { ...fixedArgs }
    for (const prop of exposed) {
      const valueIndex = prop.values.indexOf(combination[prop.name]!)
      if (valueIndex >= 0) Object.assign(args, prop.cvaArgs[valueIndex]!)
    }
    const key = combinationKey(combination)
    if (key in resolved) continue
    resolved[key] = twMerge(clsx(resolver(args), statics.join(" ")))
  }
  return resolved
}
