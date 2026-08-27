import { parse } from "@babel/parser"
import type { File } from "@babel/types"

/** レジストリの files[].content はTSX。AST解析にはBabel(typescript + jsx)を使う。 */
export function parseTsx(code: string): File {
  return parse(code, { sourceType: "module", plugins: ["typescript", "jsx"] })
}
