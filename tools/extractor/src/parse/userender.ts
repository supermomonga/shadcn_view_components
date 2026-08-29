import * as t from "@babel/types"
import type { CallExpression, File, ObjectExpression, ReturnStatement } from "@babel/types"

import { ParseError } from "../errors.ts"
import { traverse } from "./babel.ts"

/**
 * base-nova で採用された Base UI の useRender パターンを、従来の JSX 返却形状へ
 * 機械的に書き換える(upstream新構文の吸収は抽出器の責務 — 03-extraction-codegen §8)。
 *
 *   return useRender({
 *     defaultTagName: "span",
 *     props: mergeProps<"span">({ className: cn(badgeVariants({ variant }), className) }, props),
 *     render,
 *     state: { slot: "badge", variant },
 *   })
 *
 *   → return <span data-slot="badge" data-variant={variant} className={cn(...)} {...props} />
 *
 * - state の各キーは Base UI が data-<key> 属性としてDOMへ出力するため、対応する
 *   data-* 属性として合成する(slot は data-slot)。
 * - render prop(Base UIの描画差し替え)は asChild 同様、DOM契約の対象外として落とす。
 * - 認識できない形状は ParseError とする(黙って契約を欠落させない)。
 */
export function rewriteUseRenderReturns(ast: File, item: string, file: string): void {
  const pending = new Set<CallExpression>()
  traverse(ast, {
    CallExpression: (path) => {
      if (isUseRenderCall(path.node)) pending.add(path.node)
    },
  })
  if (pending.size === 0) return

  const handled = new Set<CallExpression>()
  traverse(ast, {
    ReturnStatement: (path) => {
      const argument = path.node.argument
      if (!argument || argument.type !== "CallExpression" || !isUseRenderCall(argument)) return
      const parent = path.getFunctionParent()
      if (!parent) return
      const body = parent.node.body
      if (body.type !== "BlockStatement") return
      const returns = body.body.filter((statement): statement is ReturnStatement => statement.type === "ReturnStatement")
      if (returns.length !== 1) return
      path.replaceWith(t.returnStatement(synthesizeJsx(argument, item, file)))
      handled.add(argument)
    },
    // sidebar-menu-button 等: const comp = useRender({...}) の代入。comp は条件分岐で
    // 裸 / ラッパーの両方から返りうるため、呼び出し式だけをJSXへ置き換える
    VariableDeclarator: (path) => {
      const init = path.node.init
      if (!init || init.type !== "CallExpression" || !isUseRenderCall(init)) return
      path.node.init = synthesizeJsx(init, item, file)
      handled.add(init)
    },
    ArrowFunctionExpression: (path) => {
      const body = path.node.body
      if (body.type !== "CallExpression" || !isUseRenderCall(body)) return
      path.node.body = synthesizeJsx(body, item, file)
      handled.add(body)
    },
  })

  for (const call of pending) {
    if (!handled.has(call)) {
      throw new ParseError(
        "unrecognized useRender(...) usage — only a single `return useRender({...})` per component function is supported",
        item,
        file,
        call.loc?.start,
      )
    }
  }
}

function isUseRenderCall(node: CallExpression): boolean {
  const callee = node.callee
  return callee.type === "Identifier" && callee.name === "useRender"
}

function synthesizeJsx(call: CallExpression, item: string, file: string): t.JSXElement {
  const config = call.arguments[0]
  if (call.arguments.length !== 1 || !config || config.type !== "ObjectExpression") {
    throw new ParseError("useRender(...) expects a single object literal argument", item, file, call.loc?.start)
  }

  let tagName = ""
  const attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute> = []
  for (const property of config.properties) {
    if (property.type !== "ObjectProperty" || property.key.type !== "Identifier") {
      throw new ParseError("unsupported useRender config property", item, file, property.loc?.start)
    }
    switch (property.key.name) {
      case "defaultTagName": {
        if (property.value.type !== "StringLiteral") {
          throw new ParseError("useRender defaultTagName must be a string literal", item, file, property.loc?.start)
        }
        tagName = property.value.value
        break
      }
      case "props":
        attributes.push(...propsAttributes(property.value, item, file))
        break
      case "state":
        attributes.push(...stateAttributes(property.value, item, file))
        break
      case "render":
        // 描画差し替えprop。DOM属性にならないため asChild 同様に対象外
        break
      default:
        throw new ParseError(`unsupported useRender config key '${property.key.name}'`, item, file, property.loc?.start)
    }
  }
  if (tagName === "") {
    throw new ParseError("useRender config is missing defaultTagName", item, file, call.loc?.start)
  }

  return t.jsxElement(t.jsxOpeningElement(t.jsxIdentifier(tagName), attributes, true), null, [], true)
}

/** props: mergeProps({...}, props) | {...} を属性列へ落とす。mergeProps の第2引数以降は spread。 */
function propsAttributes(value: t.Node, item: string, file: string): Array<t.JSXAttribute | t.JSXSpreadAttribute> {
  if (value.type === "ObjectExpression") return objectAttributes(value, item, file)

  if (value.type === "CallExpression" && value.callee.type === "Identifier" && value.callee.name === "mergeProps") {
    const attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute> = []
    const [head, ...rest] = value.arguments
    if (!head || head.type !== "ObjectExpression") {
      throw new ParseError("mergeProps(...) expects an object literal as its first argument", item, file, value.loc?.start)
    }
    attributes.push(...objectAttributes(head, item, file))
    for (const argument of rest) {
      if (argument.type !== "Identifier") {
        throw new ParseError("unsupported mergeProps(...) argument (expected an identifier to spread)", item, file, argument.loc?.start)
      }
      attributes.push(t.jsxSpreadAttribute(t.identifier(argument.name)))
    }
    return attributes
  }

  throw new ParseError("unsupported useRender props value", item, file, value.loc?.start)
}

function objectAttributes(object: ObjectExpression, item: string, file: string): Array<t.JSXAttribute | t.JSXSpreadAttribute> {
  const attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute> = []
  for (const property of object.properties) {
    if (property.type === "SpreadElement") {
      if (property.argument.type !== "Identifier") {
        throw new ParseError("unsupported spread in useRender props object", item, file, property.loc?.start)
      }
      attributes.push(t.jsxSpreadAttribute(t.identifier(property.argument.name)))
      continue
    }
    if (property.type !== "ObjectProperty" || property.key.type !== "Identifier") {
      throw new ParseError("unsupported property in useRender props object", item, file, property.loc?.start)
    }
    attributes.push(jsxAttributeFrom(property.key.name, property.value, item, file))
  }
  return attributes
}

/** state: { slot: "badge", variant } を data-* 属性列へ落とす。 */
function stateAttributes(value: t.Node, item: string, file: string): Array<t.JSXAttribute | t.JSXSpreadAttribute> {
  if (value.type !== "ObjectExpression") {
    throw new ParseError("useRender state must be an object literal", item, file, value.loc?.start)
  }
  const attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute> = []
  for (const property of value.properties) {
    if (property.type !== "ObjectProperty" || property.key.type !== "Identifier") {
      throw new ParseError("unsupported property in useRender state object", item, file, property.loc?.start)
    }
    if (property.key.name === "slot" && property.value.type === "StringLiteral") {
      attributes.push(t.jsxAttribute(t.jsxIdentifier("data-slot"), t.stringLiteral(property.value.value)))
      continue
    }
    attributes.push(jsxAttributeFrom(`data-${property.key.name}`, property.value, item, file))
  }
  return attributes
}

function jsxAttributeFrom(name: string, value: t.Node, item: string, file: string): t.JSXAttribute {
  if (value.type === "StringLiteral") return t.jsxAttribute(t.jsxIdentifier(name), t.stringLiteral(value.value))
  // 変数・式は動的属性として式コンテナで保持する(既存の dynamic_attributes 規約に揃える)
  return t.jsxAttribute(t.jsxIdentifier(name), t.jsxExpressionContainer(value as t.Expression))
}
