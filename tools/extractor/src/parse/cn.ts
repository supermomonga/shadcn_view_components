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
  /** cva(...) 呼び出し時のオプション(呼び出し側での値の与え方) */
  cvaOptions: CvaOption[]
  hasUserClass: boolean
}

/**
 * cn 内の `cva({...})` 呼び出しオプション1個の与え方。
 * - passthrough: `{ size }` のようにコンポーネントpropをそのまま渡す(全値域を列挙)
 * - fixed: `{ variant: "outline" }` のように固定値で渡す
 * - conditional: `{ variant: isActive ? "outline" : "ghost" }` のように条件で切り替える。
 *   条件識別子をそのままコンポーネントの露出propとして契約化する(pagination)
 */
export type CvaOption =
  | { prop: string, kind: "passthrough" }
  | { prop: string, kind: "fixed", value: string }
  | { prop: string, kind: "conditional", condition: string, trueValue: string, falseValue: string }

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
  const fileDefaults = collectFileScopedDefaults(ast)

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

      const call: CnCall = { slot: slotOf(path), statics: [], cvaRef: null, cvaOptions: [], hasUserClass: false }
      for (const argument of expression.arguments) {
        classifyCnArgument(argument, call, cvaDefinitions, item, file, fileDefaults, expression.loc?.start)
      }
      calls.push(call)
    },
  })

  return { calls }
}

/**
 * ファイル内の全関数パラメータから `identifier = "literal"` 形式の既定値を集める。
 * carousel の `orientation` のようにコンテキスト経由で受け取る値は対象関数の
 * パラメータに現れないため、ルートコンポーネントの既定値(`orientation = "horizontal"`)
 * をファイルスコープのフォールバックとして使う
 */
function collectFileScopedDefaults(ast: File): Map<string, string> {
  const defaults = new Map<string, string>()
  traverse(ast, {
    FunctionDeclaration: (path) => collectParamDefaults(path.node.params, defaults),
    FunctionExpression: (path) => collectParamDefaults(path.node.params, defaults),
    ArrowFunctionExpression: (path) => collectParamDefaults(path.node.params, defaults),
    ObjectMethod: (path) => collectParamDefaults(path.node.params, defaults),
  })
  return defaults
}

function collectParamDefaults(params: readonly Node[], defaults: Map<string, string>): void {
  for (const param of params) {
    if (param.type !== "ObjectPattern") continue
    for (const property of param.properties) {
      if (property.type !== "ObjectProperty") continue
      const key = property.key
      const name = key.type === "Identifier" ? key.name : key.type === "StringLiteral" ? key.value : null
      if (name === null) continue
      const value = property.value.type === "AssignmentPattern" ? property.value.right : property.value
      if (value.type === "StringLiteral" && !defaults.has(name)) defaults.set(name, value.value)
    }
  }
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
  fileDefaults: Map<string, string>,
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
      classifyCnArgument(argument.right, call, cvaDefinitions, item, file, fileDefaults, loc)
      return
    case "ConditionalExpression": {
      // `orientation === "horizontal" ? A : B` の静的文字列分岐。
      // 識別子の既定値(当該関数またはファイル内ルートのパラメータ既定値)で
      // 分岐を確定させ、既定側を静的クラスとして採用する(carousel)。
      const resolved = resolveConditionalStatic(argument, fileDefaults)
      if (resolved !== null) {
        call.statics.push(resolved)
        return
      }
      break
    }
    case "CallExpression": {
      if (argument.callee.type === "Identifier" && cvaDefinitions.has(argument.callee.name)) {
        call.cvaRef = argument.callee.name
        const variantPropNames = new Set(Object.keys(cvaDefinitions.get(argument.callee.name)!.variants))
        const options = argument.arguments[0]
        if (options && options.type === "ObjectExpression") {
          describeCvaOptions(options, variantPropNames, call, item, file, argument.loc?.start)
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

/**
 * `<identifier> === "literal" ? "A" : "B"` を、識別子のファイルスコープ既定値で評価する。
 * 解決できない(既定値が無い/分岐が文字列でない)場合は null
 */
function resolveConditionalStatic(
  node: Extract<Node, { type: "ConditionalExpression" }>,
  fileDefaults: Map<string, string>,
): string | null {
  const test = node.test
  if (test.type !== "BinaryExpression" || (test.operator !== "===" && test.operator !== "!==")) return null
  const { left, right } = test
  let identifier: string | null = null
  let literal: string | null = null
  if (left.type === "Identifier" && right.type === "StringLiteral") {
    identifier = left.name
    literal = right.value
  } else if (left.type === "StringLiteral" && right.type === "Identifier") {
    identifier = right.name
    literal = left.value
  }
  if (identifier === null || literal === null) return null

  const defaultValue = fileDefaults.get(identifier)
  if (defaultValue === undefined) return null
  const matches = test.operator === "===" ? defaultValue === literal : defaultValue !== literal
  const chosen = matches ? node.consequent : node.alternate
  return chosen.type === "StringLiteral" ? chosen.value : null
}

function describeCvaOptions(
  options: ObjectExpression,
  variantPropNames: Set<string>,
  call: CnCall,
  item: string,
  file: string,
  loc?: { line: number, column: number },
): void {
  for (const property of options.properties) {
    if (property.type !== "ObjectProperty") continue
    const key = property.key
    const name = key.type === "Identifier" ? key.name : key.type === "StringLiteral" ? key.value : null
    if (name === null) continue
    if (name === "className") {
      call.hasUserClass = true
      continue
    }
    if (!variantPropNames.has(name)) continue // バリアントprop以外は将来対応(現状のupstreamに存在しない)

    const value = property.value
    if (value.type === "Identifier") {
      call.cvaOptions.push({ prop: name, kind: "passthrough" })
      continue
    }
    if (value.type === "LogicalExpression") {
      // `context.variant || variant` のようにコンテキスト値へフォールバックする
      // 識別子のみの式は、結果としてコンポーネントpropが流れるため passthrough 扱い
      const sides = [value.left, value.right]
      if (sides.every((side) => side.type === "Identifier" || side.type === "MemberExpression")) {
        call.cvaOptions.push({ prop: name, kind: "passthrough" })
        continue
      }
    }
    if (value.type === "StringLiteral") {
      call.cvaOptions.push({ prop: name, kind: "fixed", value: value.value })
      continue
    }
    if (value.type === "ConditionalExpression") {
      const test = value.test
      if (
        test.type === "Identifier" &&
        value.consequent.type === "StringLiteral" &&
        value.alternate.type === "StringLiteral"
      ) {
        call.cvaOptions.push({
          prop: name,
          kind: "conditional",
          condition: test.name,
          trueValue: value.consequent.value,
          falseValue: value.alternate.value,
        })
        continue
      }
    }
    throw new ParseError(
      `unsupported cva option '${name}': ${String(value.type)} ` +
        "(passthrough identifiers, string literals and identifier-conditioned literals are supported)",
      item, file, loc,
    )
  }
}

function memberPath(node: { type: string, object?: unknown, property?: unknown }): string {
  const object = node.object as { type: string, name?: string, object?: unknown } | undefined
  const property = node.property as { name?: string, value?: string } | undefined
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
