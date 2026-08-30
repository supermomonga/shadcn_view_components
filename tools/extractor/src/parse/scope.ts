import type { NodePath } from "@babel/traverse"
import type { Node } from "@babel/types"

import type { FunctionLike } from "./context.ts"

/**
 * JSXが対象コンポーネント本体、またはその中で直ちに実行される配列処理等の
 * callbackに属するかを判定する。`.map(() => <Item />)`や
 * `Array.from(values, () => <Item />)`も描画木の一部だが、Babelの
 * getFunctionParent()はcallback自身を返すため、対象関数との単純比較では
 * 見落としていた。
 *
 * callback以外の入れ子関数は別の描画単位になり得るため収集しない。
 */
export function belongsToRenderFunction(path: NodePath<Node>, fnNode: FunctionLike): boolean {
  let functionPath = path.getFunctionParent() as NodePath<Node> | null

  if (!functionPath) return false
  if (functionPath.node === fnNode) return true

  // callback内に書かれているだけでは描画結果とは限らない。callback自身が返す
  // 式の一部であることを最初に確認する(未使用のローカルJSX等を除外する)。
  if (!belongsToReturnedExpression(path, functionPath.node)) return false

  while (functionPath) {
    const callPath = functionPath.parentPath as NodePath<Node> | null
    if (!callPath?.isCallExpression()) return false
    const callbackNode = functionPath.node
    if (!callPath.node.arguments.some((argument: Node | null) => argument === callbackNode)) return false

    const parentFunction = callPath.getFunctionParent() as NodePath<Node> | null
    if (!parentFunction) return false

    // 入れ子のcallbackでは、内側の呼び出し結果が外側callbackの返却値へ
    // 実際に流れる場合だけ上位へ辿る。副作用用callbackを同じ描画木へ混ぜない。
    if (!belongsToReturnedExpression(callPath, parentFunction.node)) return false

    if (parentFunction.node === fnNode) {
      return belongsToReturnedJsxChild(callPath, fnNode)
    }

    functionPath = parentFunction
  }

  return false
}

/** pathが対象関数のreturn式、または簡潔なarrow bodyの一部か。 */
function belongsToReturnedExpression(path: NodePath<Node>, fnNode: Node): boolean {
  let current: NodePath<Node> | null = path

  while (current) {
    const parent = current.parentPath as NodePath<Node> | null
    if (!parent) return false

    if (parent.isReturnStatement()) {
      return parent.getFunctionParent()?.node === fnNode
    }

    if (parent.node === fnNode) {
      return fnNode.type === "ArrowFunctionExpression" &&
        fnNode.body.type !== "BlockStatement" && fnNode.body === current.node
    }

    if (parent.isFunction()) return false
    current = parent
  }

  return false
}

/** callbackを実行するcallが、対象関数から返されるJSXの子式に含まれるか。 */
function belongsToReturnedJsxChild(path: NodePath<Node>, fnNode: FunctionLike): boolean {
  let current: NodePath<Node> | null = path
  let jsxChild = false

  while (current) {
    const parent = current.parentPath as NodePath<Node> | null
    if (!parent) return false

    // JSX属性へ渡した配列やcallbackの返却要素は、そのコンポーネント自身の
    // DOMツリーとは限らないため収集しない。
    if (parent.isJSXAttribute() || parent.isJSXSpreadAttribute()) return false
    if (parent.isJSXExpressionContainer()) {
      const container = parent.parentPath
      if (container?.isJSXElement() || container?.isJSXFragment()) jsxChild = true
    }

    if (parent.isReturnStatement()) {
      return jsxChild && parent.getFunctionParent()?.node === fnNode
    }

    if (parent.node === fnNode) {
      return jsxChild && fnNode.type === "ArrowFunctionExpression" &&
        fnNode.body.type !== "BlockStatement" && fnNode.body === current.node
    }

    if (parent.isFunction()) return false
    current = parent
  }

  return false
}
