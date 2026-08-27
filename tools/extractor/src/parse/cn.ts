import type { NodePath } from "@babel/traverse"
import type { File, JSXAttribute, Node, ObjectExpression } from "@babel/types"

import type { CvaDefinition } from "../contract.ts"
import { ParseError } from "../errors.ts"
import { traverse } from "./babel.ts"
import type { FunctionLike } from "./context.ts"

/**
 * `className={cn(A, B)}` をAST上で発見し、A/Bそれぞれの種別
 * (cva参照 / 文字列 / props.className)を記録する(03-extraction-codegen §3)。
 * `props.className` は「利用者上書き可能」の印として契約に反映される。
 *
 * 1関数に複数の cn 呼び出しがありうる(switch の root と thumb 等)ため、
 * 呼び出し単位で収集する。契約の combinations になるのは「主」の呼び出し
 * (ルート要素のもの)で、静的なだけのサブ要素の cn はそのスロットの
 * static_attributes["class"] に落とす(pipeline で選別する)
 */
export interface CnCall {
  /** cn を持つ要素の data-slot(無い場合は "") */
  slot: string
  statics: string[]
  cvaRef: string | null
  cvaProps: string[]
  hasUserClass: boolean
}

export interface CnAnalysis {
  calls: CnCall[]
}

export function analyzeCn(
  ast: File,
  fnNode: FunctionLike,
  cvaDefinitions: Map<string, CvaDefinition>,
  item: string,
  file: string,
): CnAnalysis {
  const calls: CnCall[] = []

  traverse(ast, {
    JSXAttribute: (path) => {
      if (path.node.name.type !== "JSXIdentifier") return
      if (path.node.name.name !== "className" && path.node.name.name !== "class") return
      const value = path.node.value
      if (!value || value.type !== "JSXExpressionContainer") return
      const expression = value.expression
      if (expression.type !== "CallExpression") return
      if (expression.callee.type !== "Identifier" || expression.callee.name !== "cn") return

      const belongsToFunction = path.getFunctionParent()?.node === fnNode
      if (!belongsToFunction) return

      const call: CnCall = { slot: slotOf(path), statics: [], cvaRef: null, cvaProps: [], hasUserClass: false }
      for (const argument of expression.arguments) {
        classifyCnArgument(argument, call, cvaDefinitions, item, file, expression.loc?.start)
      }
      calls.push(call)
    },
  })

  return { calls }
}

/** このcnが属する要素の data-slot(無い場合は "") */
function slotOf(path: NodePath): string {
  const element = path.findParent((parent) => parent.isJSXElement()) as
    | { node: { openingElement: { attributes: Array<JSXAttribute> } } }
    | null
  if (!element) return ""
  for (const attribute of element.node.openingElement.attributes) {
    if (attribute.type !== "JSXAttribute") continue
    if (attribute.name.type !== "JSXIdentifier" || attribute.name.name !== "data-slot") continue
    const value = attribute.value
    if (value?.type === "StringLiteral") return value.value
  }
  return ""
}

function classifyCnArgument(
  argument: Node,
  call: CnCall,
  cvaDefinitions: Map<string, CvaDefinition>,
  item: string,
  file: string,
  loc?: { line: number, column: number },
): void {
  if (argument === null || argument === undefined) return
  switch (argument.type) {
    case "StringLiteral":
      call.statics.push(argument.value)
      return
    case "TemplateLiteral":
      if (argument.expressions.length === 0 && argument.quasis.length === 1) {
        call.statics.push(argument.quasis[0]!.value.cooked ?? argument.quasis[0]!.value.raw)
        return
      }
      break
    case "Identifier":
      if (argument.name === "className") {
        call.hasUserClass = true
        return
      }
      break
    case "MemberExpression": {
      const sourceCode = memberPath(argument)
      if (sourceCode === "props.className" || sourceCode.endsWith(".className")) {
        call.hasUserClass = true
        return
      }
      break
    }
    case "LogicalExpression":
      // cn(cond && "x") のような条件は右辺のみを再帰的に分類する(静的側のみ採れる)
      classifyCnArgument(argument.right, call, cvaDefinitions, item, file, loc)
      return
    case "CallExpression": {
      if (argument.callee.type === "Identifier" && cvaDefinitions.has(argument.callee.name)) {
        call.cvaRef = argument.callee.name
        const variantPropNames = new Set(Object.keys(cvaDefinitions.get(argument.callee.name)!.variants))
        const options = argument.arguments[0]
        if (options && options.type === "ObjectExpression") {
          describeCvaOptions(options, variantPropNames, call)
          return
        }
        throw new ParseError(
          `cva reference '${argument.callee.name}' must be called with an inline object literal of variant props`,
          item, file, loc,
        )
      }
      break
    }
    default:
      break
  }
  throw new ParseError(
    `unsupported cn() argument: ${String(argument.type)} ` +
      "(only static strings, cva(...) calls and className references are supported)",
    item, file, loc,
  )
}

function describeCvaOptions(options: ObjectExpression, variantPropNames: Set<string>, call: CnCall): void {
  for (const property of options.properties) {
    if (property.type !== "ObjectProperty") continue
    const key = property.key
    const name = key.type === "Identifier" ? key.name : key.type === "StringLiteral" ? key.value : null
    if (name === null) continue
    if (name === "className") {
      call.hasUserClass = true
      continue
    }
    if (variantPropNames.has(name)) {
      call.cvaProps.push(name)
    }
    // バリアントprop以外の静的オプションはPhase 0の対象外。未知キーは無視せず記録しない(将来対応)
  }
}

function memberPath(node: { type: string, object?: unknown, property?: unknown }): string {
  const object = node.object as { type: string, name?: string, object?: unknown } | undefined
  const property = node.property as { type: string, name?: string, value?: string } | undefined
  const objectText = object
    ? object.type === "Identifier"
      ? (object.name ?? "?")
      : object.object
        ? memberPath(object as unknown as { type: string, object?: unknown, property?: unknown })
        : "?"
    : "?"
  const propertyText = property?.name ?? property?.value ?? "?"
  return `${objectText}.${propertyText}`
}
