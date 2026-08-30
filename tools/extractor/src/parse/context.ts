import type { ArrowFunctionExpression, File, FunctionDeclaration, FunctionExpression, Node } from "@babel/types"

import { ParseError } from "../errors.ts"
import { traverse } from "./babel.ts"

export type FunctionLike = FunctionDeclaration | FunctionExpression | ArrowFunctionExpression

export interface DiscoveredExport {
  /** upstreamのエクスポート名 */
  name: string
  /** コンポーネント実装の関数ノード(JSXを返すもの)。cva定義のみのエクスポートは null */
  functionNode: FunctionLike | null
  /** `const Select = SelectPrimitive.Root` 形式のプリミティブRoot別名。 */
  primitiveRootTag: string | null
}

interface ExportBinding {
  functionNode: FunctionLike | null
  primitiveRootTag: string | null
}

/**
 * 「どのJSX要素がどのコンポーネントエクスポートに属するか」の解決(03-extraction-codegen §2)。
 * 1アイテムが複数ファイル・複数エクスポートを持つ場合、エクスポートごとに束ねる。
 */
export function discoverExports(ast: File, item: string, file: string): DiscoveredExport[] {
  const found = new Map<string, ExportBinding>()
  const record = (name: string, binding: ExportBinding) => {
    if (!found.has(name)) found.set(name, binding)
  }

  traverse(ast, {
    ExportNamedDeclaration: (path) => {
      if (path.node.specifiers.length > 0) {
        for (const specifier of path.node.specifiers) {
          if (specifier.type !== "ExportSpecifier") continue
          const name = specifier.exported.type === "Identifier" ? specifier.exported.name : specifier.exported.value
          record(name, resolveBindingForName(ast, specifier.local.name))
        }
        return
      }
      const declaration = path.node.declaration
      if (!declaration) return
      if (declaration.type === "FunctionDeclaration" && declaration.id) {
        record(declaration.id.name, { functionNode: declaration, primitiveRootTag: null })
        return
      }
      if (declaration.type === "VariableDeclaration") {
        for (const declarator of declaration.declarations) {
          if (declarator.id.type !== "Identifier") continue
          const init = declarator.init
          if (init && (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression")) {
            record(declarator.id.name, { functionNode: init, primitiveRootTag: null })
          } else {
            record(declarator.id.name, { functionNode: null, primitiveRootTag: primitiveRootTag(init) })
          }
        }
      }
    },
  })

  if (found.size === 0) {
    throw new ParseError("no named exports found (only export functions/components are supported)", item, file)
  }
  return [...found.entries()].map(([name, binding]) => ({ name, ...binding }))
}

function resolveBindingForName(ast: File, localName: string): ExportBinding {
  let resolved: FunctionLike | null = null
  let rootTag: string | null = null
  traverse(ast, {
    FunctionDeclaration: (path) => {
      if (path.node.id?.name === localName) resolved = path.node
    },
    VariableDeclarator: (path) => {
      if (path.node.id.type !== "Identifier" || path.node.id.name !== localName) return
      const init = path.node.init
      if (init && (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression")) {
        resolved = init
      } else {
        rootTag = primitiveRootTag(init)
      }
    },
  })
  return { functionNode: resolved, primitiveRootTag: rootTag }
}

/**
 * shadcnがDOMを追加せずプリミティブRootをそのまま公開する別名を識別する。
 * 他の変数エクスポート(cva定義やhooks)はこの経路に入れない。
 */
function primitiveRootTag(node: Node | null | undefined): string | null {
  if (!node || node.type !== "MemberExpression" || node.computed) return null
  if (node.property.type !== "Identifier" || node.property.name !== "Root") return null
  const tag = memberExpressionName(node)
  const owner = tag?.split(".").at(-2)
  return owner?.endsWith("Primitive") ? tag : null
}

function memberExpressionName(node: Node): string | null {
  if (node.type === "Identifier") return node.name
  if (node.type !== "MemberExpression" || node.computed || node.property.type !== "Identifier") return null
  const object = memberExpressionName(node.object)
  return object ? `${object}.${node.property.name}` : null
}
