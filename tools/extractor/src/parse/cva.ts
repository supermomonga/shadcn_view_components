import type { CallExpression, File, ObjectExpression, StringLiteral, TemplateLiteral, VariableDeclarator } from "@babel/types"

import type { CvaDefinition } from "../contract.ts"
import { ParseError } from "../errors.ts"
import { traverse } from "./babel.ts"

/** 静的に確定しないものは推測しない: 文字列リテラル(式なしテンプレートリテラル)のみ受け入れる。 */
export function requireStaticString(
  node: unknown,
  item: string,
  file: string,
  what: string,
  loc?: { line: number, column: number },
): string {
  if (node !== null && node !== undefined && typeof node === "object") {
    const n = node as StringLiteral | TemplateLiteral
    if (n.type === "StringLiteral") return n.value
    if (n.type === "TemplateLiteral" && n.expressions.length === 0 && n.quasis.length === 1) {
      return n.quasis[0]!.value.cooked ?? n.quasis[0]!.value.raw
    }
  }
  throw new ParseError(`${what} must be a static string literal (dynamic expressions are not supported)`, item, file, loc)
}

function propertyName(node: unknown, item: string, file: string): string {
  if (node !== null && node !== undefined && typeof node === "object") {
    const n = node as { type: string, name?: string, value?: string }
    if (n.type === "Identifier") return n.name!
    if (n.type === "StringLiteral") return n.value!
  }
  throw new ParseError(`unsupported object key: ${String((node as { type?: string })?.type)}`, item, file)
}

/** `const <id>Variants = cva(base, config)` 呼び出しの解析(03-extraction-codegen §3)。 */
export function extractCvaDefinitions(ast: File, item: string, file: string): Map<string, CvaDefinition> {
  const definitions = new Map<string, CvaDefinition>()

  traverse(ast, {
    VariableDeclarator: (path) => {
      const init = path.node.init
      if (!init || init.type !== "CallExpression") return
      if (init.callee.type !== "Identifier" || init.callee.name !== "cva") return
      if (path.node.id.type !== "Identifier") {
        throw new ParseError("cva() result must be assigned to a plain identifier", item, file, init.loc?.start)
      }
      const identifier = path.node.id.name

      const base = requireStaticString(init.arguments[0], item, file, `cva base of '${identifier}'`, init.loc?.start)

      const variants: Record<string, Record<string, string>> = {}
      const compound: Array<{ when: Record<string, string>, class: string }> = []
      const defaults: Record<string, string> = {}

      const config = init.arguments[1]
      if (config !== undefined) {
        if (config.type !== "ObjectExpression") {
          throw new ParseError("second argument of cva() must be an object literal", item, file, config.loc?.start)
        }
        for (const prop of config.properties) {
          if (prop.type !== "ObjectProperty") {
            throw new ParseError(`unsupported cva config entry: ${prop.type}`, item, file, prop.loc?.start)
          }
          const key = propertyName(prop.key, item, file)
          if (key === "variants") {
            const value = prop.value as ObjectExpression
            if (value.type !== "ObjectExpression") {
              throw new ParseError("cva variants must be an object literal", item, file, value.loc?.start)
            }
            for (const variantProp of value.properties) {
              if (variantProp.type !== "ObjectProperty") {
                throw new ParseError(`unsupported variants entry: ${variantProp.type}`, item, file, variantProp.loc?.start)
              }
              const propName = propertyName(variantProp.key, item, file)
              const values: Record<string, string> = {}
              const valueMap = variantProp.value as ObjectExpression
              if (valueMap.type !== "ObjectExpression") {
                throw new ParseError(`variants.${propName} must be an object literal`, item, file, valueMap.loc?.start)
              }
              for (const valueProp of valueMap.properties) {
                if (valueProp.type !== "ObjectProperty") {
                  throw new ParseError(`unsupported variants.${propName} entry`, item, file, valueProp.loc?.start)
                }
                values[propertyName(valueProp.key, item, file)] = requireStaticString(
                  valueProp.value, item, file, `variants.${propName} value`, valueProp.loc?.start,
                )
              }
              variants[propName] = values
            }
          } else if (key === "compoundVariants") {
            if (prop.value.type !== "ArrayExpression") {
              throw new ParseError("compoundVariants must be an array literal", item, file, prop.value.loc?.start)
            }
            for (const element of prop.value.elements) {
              if (!element || element.type !== "ObjectExpression") {
                throw new ParseError("compoundVariants entries must be object literals", item, file, element?.loc?.start)
              }
              const when: Record<string, string> = {}
              let classValue = ""
              for (const entry of element.properties) {
                if (entry.type !== "ObjectProperty") {
                  throw new ParseError("unsupported compoundVariants entry", item, file, entry.loc?.start)
                }
                const entryKey = propertyName(entry.key, item, file)
                if (entryKey === "class") {
                  classValue = requireStaticString(entry.value, item, file, "compoundVariants class", entry.loc?.start)
                } else {
                  when[entryKey] = requireStaticString(entry.value, item, file, `compoundVariants ${entryKey}`, entry.loc?.start)
                }
              }
              compound.push({ when, class: classValue })
            }
          } else if (key === "defaultVariants") {
            const value = prop.value as ObjectExpression
            if (value.type !== "ObjectExpression") {
              throw new ParseError("defaultVariants must be an object literal", item, file, value.loc?.start)
            }
            for (const entry of value.properties) {
              if (entry.type !== "ObjectProperty") {
                throw new ParseError("unsupported defaultVariants entry", item, file, entry.loc?.start)
              }
              defaults[propertyName(entry.key, item, file)] = requireStaticString(
                entry.value, item, file, "defaultVariants value", entry.loc?.start,
              )
            }
          }
        }
      }

      definitions.set(identifier, { identifier, base, variants, compound, defaults })
    },
  })

  return definitions
}

/** 型ガード: cva呼び出しの見た目を持つCallExpression(デバッグ・テスト用に公開)。 */
export function isCvaCall(node: CallExpression): boolean {
  return node.callee.type === "Identifier" && node.callee.name === "cva"
}

export function isVariableDeclarator(node: unknown): node is VariableDeclarator {
  return (node as VariableDeclarator)?.type === "VariableDeclarator"
}
