/**
 * Tailwind の生成CSSから、依存ライブラリが所有する最初の preflight(base) 層を除く。
 *
 * Tailwind 4.3 のnative CSS変換は同じ入力でもmacOSとLinuxでpreflightの
 * 等価な表現が異なる。dummy CSSの鮮度検査が対象とするのは、この依存物ではなく
 * リポジトリのtheme、utilities、追加base層などの出力である。
 */
export function withoutDependencyPreflight(css: string): string {
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
