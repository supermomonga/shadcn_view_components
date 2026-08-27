import { cva } from "class-variance-authority"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import type { CvaDefinition } from "../contract.ts"
import { combinationKey } from "../normalize.ts"

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
 */
export function resolveCnCombinations(definition: CvaDefinition | null, statics: string[]): Record<string, string> {
  const base = definition ? [definition.base, ...statics].join(" ") : statics.join(" ")
  const resolver = cva(base, {
    variants: definition?.variants ?? {},
    compoundVariants: definition?.compound.map((entry) => ({ ...entry.when, class: entry.class })) ?? [],
    defaultVariants: definition?.defaults ?? {},
  })

  const combinations = definition ? enumerateCombinations(definition.variants) : [{}]
  const resolved: Record<string, string> = {}
  for (const combination of combinations) {
    const value = twMerge(clsx(resolver(combination)))
    const key = combinationKey(combination)
    if (key in resolved) continue // 同一キーの重複(理論上ない)は最初を採用
    resolved[key] = value
  }
  return resolved
}
