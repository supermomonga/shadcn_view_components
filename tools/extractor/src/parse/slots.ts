import type { File, JSXAttribute, JSXElement, JSXMemberExpression, JSXOpeningElement, Node, StringLiteral } from "@babel/types"

import { ParseError } from "../errors.ts"
import { traverse } from "./babel.ts"
import type { FunctionLike } from "./context.ts"

export interface CollectedSlot {
  /** data-slot 値 */
  name: string
  /** 既定タグ("button" / "div" / ローカル変数経由の "Slot.Root" 等) */
  tag: string
  static_attributes: Record<string, string>
  dynamic_attributes: string[]
}

export interface SlotsAnalysis {
  rootTag: string
  rootSlot: string
  /** ルート要素を含む、data-slot を持つ要素の一覧(文書順) */
  slots: CollectedSlot[]
}

/**
 * 1コンポーネントエクスポートに属するJSX要素の data-slot / タグ種別 / ARIA属性の収集
 * (03-extraction-codegen §3)。条件レンダリングの分岐も同じ走査で別スロット候補として拾われる。
 */
export function collectSlots(ast: File, fnNode: FunctionLike, item: string, file: string): SlotsAnalysis {
  const localTags = collectLocalTagBindings(ast)
  const belongsToFunction = (path: { getFunctionParent(): { node: Node } | null }): boolean => {
    const parent = path.getFunctionParent()
    return parent !== null && parent.node === fnNode
  }

  const slots: CollectedSlot[] = []
  traverse(ast, {
    JSXElement: (path) => {
      if (!belongsToFunction(path)) return
      const slot = describeSlotElement(path.node.openingElement, localTags, item, file)
      if (slot) slots.push(slot)
    },
  })

  const rootElement = findRootJsxElement(ast, belongsToFunction)
  if (!rootElement) {
    throw new ParseError("component function does not return JSX", item, file)
  }

  const rootSlot = staticAttributeValue(rootElement.openingElement, "data-slot")
  if (rootSlot === undefined) {
    throw new ParseError(
      "root JSX element has no static data-slot attribute (all primitives must carry data-slot)",
      item, file, rootElement.openingElement.loc?.start,
    )
  }

  return { rootTag: describeTagName(rootElement.openingElement, localTags), rootSlot, slots }
}

function firstJsxElement(node: Node | null | undefined): JSXElement | null {
  if (!node) return null
  switch (node.type) {
    case "JSXElement":
      return node
    case "JSXFragment": {
      for (const child of node.children) {
        const found = firstJsxElement(child)
        if (found) return found
      }
      return null
    }
    case "JSXExpressionContainer":
      return firstJsxElement(node.expression)
    case "ParenthesizedExpression":
      return firstJsxElement(node.expression)
    case "ConditionalExpression":
      return firstJsxElement(node.consequent) ?? firstJsxElement(node.alternate)
    case "LogicalExpression":
      return firstJsxElement(node.right) ?? firstJsxElement(node.left)
    default:
      return null
  }
}

/** `const Comp = asChild ? Slot.Root : "button"` のような差し替えタグの既定値(ネイティブ側)を引く表。 */
function collectLocalTagBindings(ast: File): Record<string, string> {
  const table: Record<string, string> = {}
  traverse(ast, {
    VariableDeclarator: (path) => {
      const id = path.node.id
      const init = path.node.init
      if (id.type !== "Identifier" || !init) return
      if (init.type === "StringLiteral") {
        table[id.name] = init.value
      } else if (init.type === "ConditionalExpression") {
        const native = [init.consequent, init.alternate].find((branch): branch is StringLiteral => branch.type === "StringLiteral")
        if (native) {
          table[id.name] = native.value
        } else {
          const member = [init.consequent, init.alternate].find((branch) => branch.type === "MemberExpression")
          if (member) table[id.name] = memberToString(member as unknown as MemberLike)
        }
      } else if (init.type === "MemberExpression") {
        table[id.name] = memberToString(init as unknown as MemberLike)
      }
    },
  })
  return table
}

interface MemberLike {
  object: { type: string, name?: string, object?: unknown }
  property: { name?: string, value?: string }
}

function memberToString(member: MemberLike): string {
  const object = member.object
  const objectName =
    object.type === "JSXIdentifier" || object.type === "Identifier"
      ? (object.name ?? "?")
      : object.object
        ? memberToString(object as unknown as MemberLike)
        : "?"
  const propertyText = member.property.name ?? member.property.value ?? "?"
  return `${objectName}.${propertyText}`
}

/** この関数スコープのReturnStatementから、ルートJSX要素を解決する。 */
function findRootJsxElement(
  ast: File,
  belongsToFunction: (path: { getFunctionParent(): { node: Node } | null }) => boolean,
): JSXElement | null {
  const found: Array<JSXElement> = []
  traverse(ast, {
    ReturnStatement: (path) => {
      if (found.length > 0) return
      if (!belongsToFunction(path)) return
      const element = firstJsxElement(path.node.argument)
      if (element) found.push(element)
    },
  })
  return found[0] ?? null
}

function describeTagName(opening: JSXOpeningElement, localTags: Record<string, string>): string {
  const name = opening.name
  if (name.type === "JSXIdentifier") {
    if (/^[a-z]/.test(name.name)) return name.name
    return localTags[name.name] ?? name.name
  }
  if (name.type === "JSXMemberExpression") return memberToString(name)
  return "(unknown)"
}

function staticAttributeValue(opening: JSXOpeningElement, attributeName: string): string | undefined {
  for (const attribute of opening.attributes) {
    if (attribute.type !== "JSXAttribute") continue
    if (attribute.name.type !== "JSXIdentifier" || attribute.name.name !== attributeName) continue
    const value = attribute.value
    if (value === null || value === undefined) return ""
    if (value.type === "StringLiteral") return value.value
    if (value.type === "JSXExpressionContainer" && value.expression.type === "StringLiteral") return value.expression.value
    return undefined
  }
  return undefined
}

function describeSlotElement(
  opening: JSXOpeningElement,
  localTags: Record<string, string>,
  item: string,
  file: string,
): CollectedSlot | null {
  const slotName = staticAttributeValue(opening, "data-slot")
  if (slotName === undefined) return null

  const staticAttributes: Record<string, string> = {}
  const dynamicAttributes = new Set<string>()

  for (const attribute of opening.attributes) {
    if (attribute.type !== "JSXAttribute") continue
    if (attribute.name.type !== "JSXIdentifier") continue
    const name = attribute.name.name
    if (name === "data-slot" || name === "className" || name === "class" || name === "children") continue
    const value = attribute.value
    if (value === null || value === undefined) {
      staticAttributes[name] = ""
      continue
    }
    if (value.type === "StringLiteral") {
      staticAttributes[name] = value.value
      continue
    }
    if (value.type === "JSXExpressionContainer") {
      if (value.expression.type === "StringLiteral") {
        staticAttributes[name] = value.expression.value
        continue
      }
      // 動的値(変数・式)は dynamic 属性として記録し、手書き側の責務とする
      dynamicAttributes.add(name)
      continue
    }
    throw new ParseError(`unsupported JSX attribute value for '${name}'`, item, file, value.loc?.start)
  }

  return {
    name: slotName,
    tag: describeTagName(opening, localTags),
    static_attributes: staticAttributes,
    dynamic_attributes: [...dynamicAttributes].sort(),
  }
}
