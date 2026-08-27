import * as traverseModule from "@babel/traverse"

/**
 * @babel/traverse はCJSで、実行環境(tsx / vitest / 素のNode)ごとに
 * import相互運用の形状が異なる(default が関数の場合・module.exports全体の場合の二段)。
 * どの環境でも呼び出し可能なtraverse関数を取り出すヘルパ。
 */
export type TraverseFn = (typeof import("@babel/traverse"))["default"]

type UnknownRecord = Record<string, unknown>

function resolveTraverse(): TraverseFn {
  const candidate = traverseModule as unknown as UnknownRecord
  if (typeof candidate === "function") return candidate as unknown as TraverseFn
  const first = candidate.default
  if (typeof first === "function") return first as unknown as TraverseFn
  if (first !== null && typeof first === "object") {
    const second = (first as UnknownRecord).default
    if (typeof second === "function") return second as unknown as TraverseFn
  }
  throw new Error("could not resolve a callable traverse() from @babel/traverse")
}

export const traverse: TraverseFn = resolveTraverse()
