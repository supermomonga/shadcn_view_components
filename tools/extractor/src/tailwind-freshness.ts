/**
 * Tailwind の生成CSSから、依存ライブラリが所有する最初の preflight(base) 層を除く。
 *
 * Tailwind 4.3 のnative CSS変換は同じ入力でもmacOSとLinuxでpreflightの
 * 等価な表現が異なる。dummy CSSの鮮度検査が対象とするのは、この依存物ではなく
 * リポジトリのtheme、utilities、追加base層などの出力である。
 */
export function withoutDependencyPreflight(css: string): string {
  // --minifyは依存preflightと本gemのbase規則を1つの@layerへ統合する。
  // 自前の最初の規則から後ろを残し、鮮度検査で実装規則を見落とさない。
  const minifiedBase = "@layer base{"
  const minifiedStart = css.indexOf(minifiedBase)
  if (minifiedStart >= 0) {
    const ownedRule = "*{border-color:var(--border)"
    const ownedStart = css.indexOf(ownedRule, minifiedStart + minifiedBase.length)
    const baseEnd = css.indexOf("}@layer components", minifiedStart)
    if (ownedStart < 0 || baseEnd < 0 || ownedStart >= baseEnd) {
      throw new Error("minified Tailwind CSS is missing the project base boundary")
    }
    return `${css.slice(0, minifiedStart)}${minifiedBase}${css.slice(ownedStart)}`
  }

  const marker = "@layer base {"
  const start = css.indexOf(marker)
  if (start < 0) throw new Error("generated Tailwind CSS does not contain a base layer")

  let depth = 0
  let quote: "\"" | "'" | undefined
  let inComment = false

  for (let index = start; index < css.length; index += 1) {
    const current = css[index]
    const next = css[index + 1]

    if (inComment) {
      if (current === "*" && next === "/") {
        inComment = false
        index += 1
      }
      continue
    }

    if (quote) {
      if (current === "\\") {
        index += 1
      } else if (current === quote) {
        quote = undefined
      }
      continue
    }

    if (current === "/" && next === "*") {
      inComment = true
      index += 1
    } else if (current === "\"" || current === "'") {
      quote = current
    } else if (current === "{") {
      depth += 1
    } else if (current === "}") {
      depth -= 1
      if (depth === 0) return `${css.slice(0, start)}${css.slice(index + 1)}`
    }
  }

  throw new Error("generated Tailwind CSS contains an unterminated base layer")
}
