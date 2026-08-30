import type { NodePath } from "@babel/traverse"
import type { File, JSXAttribute, Node, ObjectExpression } from "@babel/types"

import type { CvaDefinition } from "../contract.ts"
import { ParseError } from "../errors.ts"
import { traverse } from "./babel.ts"
import type { FunctionLike } from "./context.ts"
import { belongsToRenderFunction } from "./scope.ts"

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
  /** cn を持つ要素のタグ名(無名ラッパースロット記録用。例: "div") */
  slotTag: string
  statics: string[]
  cvaRef: string | null
  /** cva(...) 呼び出し時のオプション(呼び出し側での値の与え方) */
  cvaOptions: CvaOption[]
  /** `side === "right" && "クラス"` 形式の列挙可能なガード(露出prop化される) */
  guards: GuardEntry[]
  hasUserClass: boolean
}

/** cn 内の enum ガード1件(`<identifier> === "value" && "classes"`) */
export interface GuardEntry {
  identifier: string
  value: string
  classes: string
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
  // 対象関数自身のパラメータ既定値を最優先にする(同名パラメータがファイル内の
  // 別関数にある場合の誤解決防止 — carousel の orientation 等のコンテキスト値は
  // ファイルスコープのフォールバックで補う)
  const fileDefaults = collectFileScopedDefaults(ast)
  collectParamDefaults(fnNode.params, fileDefaults, { override: true })

  traverse(ast, {
    JSXAttribute: (path) => {
      if (path.node.name.type !== "JSXIdentifier") return
      if (path.node.name.name !== "className" && path.node.name.name !== "class") return
      const value = path.node.value
      if (!value || value.type !== "JSXExpressionContainer") return
      const expression = value.expression
      if (expression.type !== "CallExpression") return
      if (expression.callee.type !== "Identifier" || expression.callee.name !== "cn") return

      const belongsToFunction = belongsToRenderFunction(path, fnNode)
      if (!belongsToFunction) return

      // inline callback内のdata-slotを持たない補助要素は、どの公開スロットにも
      // classを結び付けられない。Slider Thumbのような明示スロットだけを対象にする。
      const nestedCallback = path.getFunctionParent()?.node !== fnNode
      if (nestedCallback && slotOf(path) === "") return

      const call: CnCall = {
        slot: slotOf(path),
        slotTag: tagOf(path),
        statics: [],
        cvaRef: null,
        cvaOptions: [],
        guards: [],
        hasUserClass: false,
      }
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
function collectFileScopedDefaults(ast: File): FileDefaults {
  const defaults: FileDefaults = new Map()
  traverse(ast, {
    FunctionDeclaration: (path) => collectParamDefaults(path.node.params, defaults),
    FunctionExpression: (path) => collectParamDefaults(path.node.params, defaults),
    ArrowFunctionExpression: (path) => collectParamDefaults(path.node.params, defaults),
    ObjectMethod: (path) => collectParamDefaults(path.node.params, defaults),
  })
  return defaults
}

/** パラメータ既定値の表: 文字列(enum ガード/ternary解決用)と真偽値(bareガード用)を保持 */
export type FileDefaults = Map<string, string | boolean>

function collectParamDefaults(params: readonly Node[], defaults: FileDefaults, options: { override?: boolean } = {}): void {
  for (const param of params) {
    if (param.type !== "ObjectPattern") continue
    for (const property of param.properties) {
      if (property.type !== "ObjectProperty") continue
      const key = property.key
      const name = key.type === "Identifier" ? key.name : key.type === "StringLiteral" ? key.value : null
      if (name === null) continue
      const value = property.value.type === "AssignmentPattern" ? property.value.right : property.value
      if (value.type === "StringLiteral" && (options.override || !defaults.has(name))) {
        defaults.set(name, value.value)
      } else if (value.type === "BooleanLiteral" && (options.override || !defaults.has(name))) {
        defaults.set(name, value.value)
      }
    }
  }
}

/** このcnが属する要素のタグ名(ローカル変数経由の差し替えは素のタグ名を返す) */
function tagOf(path: NodePath): string {
  const element = path.findParent((parent) => parent.isJSXElement()) as
    | { node: { openingElement: { name: { type: string, name?: string } } } }
    | null
  if (!element) return "div"
  const name = element.node.openingElement.name
  if (name.type === "JSXIdentifier" && /^[a-z]/.test(name.name ?? "")) return name.name!
  return "div"
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
  fileDefaults: FileDefaults,
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
    case "LogicalExpression": {
      // `side === "right" && "inset-y-0 ..."` の列挙可能なガード。
      // 既定枝だけを静的に崩すのではなく、識別子を露出propとして全枝を契約化する
      // (sheet の side 4値等。pagination の cva conditional と同じ思想)
      const guard = enumGuard(argument)
      if (guard !== null) {
        call.guards.push(guard)
        return
      }
      // `!==` 比較のガードは値域が静的に確定しないため既定値で評価する
      const conditional = staticConditional(argument, fileDefaults)
      if (conditional !== null) {
        if (conditional !== "") call.statics.push(conditional)
        return
      }
      // cn(showOnHover && "x") の bare 識別子条件は boolean 既定値で評価する。
      // 既定値が不明なまま右辺を採用すると偽陽性になるためエスカレートする
      if (argument.left.type === "Identifier" && argument.left.name !== "className") {
        const truthy = evalStaticTest(argument.left, fileDefaults)
        if (truthy === null) {
          throw new ParseError(
            `bare identifier guard '${argument.left.name}' has no static default ` +
              "(add a parameter default or restructure upstream)",
            item, file, loc,
          )
        }
        if (truthy) call.statics.push(...staticStrings(argument.right, item, file, loc))
        return
      }
      // cn(cond && "x") のそれ以外の条件は右辺のみを再帰的に分類する(静的側のみ採れる)
      classifyCnArgument(argument.right, call, cvaDefinitions, item, file, fileDefaults, loc)
      return
    }
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
        // 引数無し呼び出し(navigationMenuTriggerStyle() 等)は cva 既定値のみの使用とみなす
        if (options && options.type === "ObjectExpression") {
          describeCvaOptions(options, variantPropNames, call, item, file, argument.loc?.start)
          return
        }
        if (!options) return
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
 * テスト式を識別子のファイルスコープ既定値で評価する。
 * `<id> === "lit"` / `<id> !== "lit"` とそれらの && / || 結合を扱う。
 * 解決できない(既定値が無い等)場合は null
 */
function evalStaticTest(test: Node, fileDefaults: FileDefaults): boolean | null {
  if (test.type === "Identifier") {
    const defaultValue = fileDefaults.get(test.name)
    return typeof defaultValue === "boolean" ? defaultValue : null
  }
  if (test.type === "LogicalExpression") {
    const left = evalStaticTest(test.left, fileDefaults)
    const right = evalStaticTest(test.right, fileDefaults)
    if (left === null || right === null) return null
    return test.operator === "&&" ? left && right : left || right
  }
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
  if (typeof defaultValue !== "string") return null
  return test.operator === "===" ? defaultValue === literal : defaultValue !== literal
}

/**
 * 条件式(`<id> === "literal" ? ... : ...` やその && / || 結合)を、識別子の
 * ファイルスコープ既定値で評価する。解決できない場合は null
 */
function resolveConditionalStatic(
  node: Extract<Node, { type: "ConditionalExpression" }>,
  fileDefaults: FileDefaults,
): string | null {
  const matches = evalStaticTest(node.test, fileDefaults)
  if (matches === null) return null
  const chosen = matches ? node.consequent : node.alternate
  return chosen.type === "StringLiteral" ? chosen.value : null
}

/** cn 引数の静的文字列を取り出す(bare ガードの右辺用。文字列でなければ ParseError) */
function staticStrings(
  node: Node,
  item: string,
  file: string,
  loc?: { line: number, column: number },
): string[] {
  if (node.type === "StringLiteral") return [node.value]
  throw new ParseError(`unsupported guard value: ${String(node.type)}`, item, file, loc)
}

/**
 * `<identifier> === "literal" && "classes"` 形式のガードを1件取り出す。
 * 値域が列挙可能な === ガードのみ。それ以外(&& 以外の演算子や右辺が文字列でない
 * 場合)は null
 */
function enumGuard(node: Extract<Node, { type: "LogicalExpression" }>): GuardEntry | null {
  if (node.operator !== "&&") return null
  if (node.left.type !== "BinaryExpression" || node.left.operator !== "===") return null
  const { left, right } = node.left
  let identifier: string | null = null
  let value: string | null = null
  if (left.type === "Identifier" && right.type === "StringLiteral") {
    identifier = left.name
    value = right.value
  } else if (left.type === "StringLiteral" && right.type === "Identifier") {
    identifier = right.name
    value = left.value
  }
  if (identifier === null || value === null) return null
  if (node.right.type !== "StringLiteral") return null
  return { identifier, value, classes: node.right.value }
}

/**
 * `!==` ガード(`<identifier> !== "literal" && "class"`)を識別子の既定値で評価する。
 * 成立する場合はそのクラス、不成立の場合は ""(採用しない)、解決不能なら null
 */
function staticConditional(
  node: Extract<Node, { type: "LogicalExpression" }>,
  fileDefaults: FileDefaults,
): string | null {
  if (node.operator !== "&&" || node.right.type !== "StringLiteral") return null
  if (node.left.type !== "BinaryExpression" || node.left.operator !== "!==") return null
  const matches = evalStaticTest(node.left, fileDefaults)
  if (matches === null) return null
  return matches ? node.right.value : ""
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
