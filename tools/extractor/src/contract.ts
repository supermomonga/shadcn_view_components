import { z } from "zod"

/** 契約JSONスキーマ(03-extraction-codegen §4)。生成直後に自己検証する。 */
export const CvaCompoundSchema = z.object({
  when: z.record(z.string(), z.string()),
  class: z.string(),
})

export const CvaSchema = z.object({
  prop_names: z.array(z.string()),
  defaults: z.record(z.string(), z.string()),
  compound: z.array(CvaCompoundSchema),
})

export const SlotSchema = z.object({
  name: z.string(),
  tag: z.string(),
  static_attributes: z.record(z.string(), z.string()),
  dynamic_attributes: z.array(z.string()),
})

export const ExportSchema = z.object({
  root_slot: z.string(),
  component_class: z.string(),
  cva: CvaSchema,
  /** 事前解決済みの最終クラス文字列。キーは "prop=value&..." 形式(静的のみの場合 "")。 */
  combinations: z.record(z.string(), z.string()),
  slots: z.array(SlotSchema),
  passthrough_class: z.boolean(),
})

export const ContractSchema = z.object({
  schema_version: z.literal(1),
  name: z.string(),
  source: z.object({ item_sha256: z.string() }),
  exports: z.record(z.string(), ExportSchema),
  css_vars: z.object({
    light: z.record(z.string(), z.string()),
    dark: z.record(z.string(), z.string()),
  }),
  css: z.string(),
  registry_dependencies: z.array(z.string()),
})

export type Cva = z.infer<typeof CvaSchema>
export type Slot = z.infer<typeof SlotSchema>
export type Export = z.infer<typeof ExportSchema>
export type Contract = z.infer<typeof ContractSchema>

/** 抽出器内部で扱うcva定義(parse結果)。 */
export interface CvaDefinition {
  identifier: string
  base: string
  variants: Record<string, Record<string, string>>
  compound: Array<{ when: Record<string, string>, class: string }>
  defaults: Record<string, string>
}
