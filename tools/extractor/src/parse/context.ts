import type { ArrowFunctionExpression, File, FunctionDeclaration, FunctionExpression } from "@babel/types"

import { ParseError } from "../errors.ts"
import { traverse } from "./babel.ts"

export type FunctionLike = FunctionDeclaration | FunctionExpression | ArrowFunctionExpression

export interface DiscoveredExport {
  /** upstreamのエクスポート名 */
  name: string
  /** コンポーネント実装の関数ノード(JSXを返すもの)。cva定義のみのエクスポートは null */
  functionNode: FunctionLike | null
}

/**
 * 「どのJSX要素がどのコンポーネントエクスポートに属するか」の解決(03-extraction-codegen §2)。
 * 1アイテムが複数ファイル・複数エクスポートを持つ場合、エクスポートごとに束ねる。
 */
export function discoverExports(ast: File, item: string, file: string): DiscoveredExport[] {
  const found = new Map<string, FunctionLike | null>()
  const record = (name: string, node: FunctionLike | null) => {
    if (!found.has(name)) found.set(name, node)
  }

  traverse(ast, {
    ExportNamedDeclaration: (path) => {
      if (path.node.specifiers.length > 0) {
        for (const specifier of path.node.specifiers) {
          if (specifier.type !== "ExportSpecifier") continue
          const name = specifier.exported.type === "Identifier" ? specifier.exported.name : specifier.exported.value
          record(name, resolveFunctionForName(ast, specifier.local.name))
        }
        return
      }
      const declaration = path.node.declaration
      if (!declaration) return
      if (declaration.type === "FunctionDeclaration" && declaration.id) {
        record(declaration.id.name, declaration)
        return
      }
      if (declaration.type === "VariableDeclaration") {
        for (const declarator of declaration.declarations) {
          if (declarator.id.type !== "Identifier") continue
          const init = declarator.init
          if (init && (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression")) {
            record(declarator.id.name, init)
          }
        }
      }
    },
  })

  if (found.size === 0) {
    throw new ParseError("no named exports found (only export functions/components are supported)", item, file)
  }
  return [...found.entries()].map(([name, functionNode]) => ({ name, functionNode }))
}

function resolveFunctionForName(ast: File, localName: string): FunctionLike | null {
  let resolved: FunctionLike | null = null
  traverse(ast, {
    FunctionDeclaration: (path) => {
      if (path.node.id?.name === localName) resolved = path.node
    },
    VariableDeclarator: (path) => {
      if (path.node.id.type !== "Identifier" || path.node.id.name !== localName) return
      const init = path.node.init
      if (init && (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression")) {
        resolved = init
      }
    },
  })
  return resolved
}
