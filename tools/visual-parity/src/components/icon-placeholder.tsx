/**
 * base-nova のコンポーネントが使う IconPlaceholder(createフロー用プレースホルダ)の
 * upstream側shim。shadcn CLI はアイコンライブラリ選択時にこの要素を実際のアイコンへ
 * 置き換えて配布するため、ここでは lucide prop を解決して同等のアイコンを描画する。
 * 他ライブラリの識別prop(tabler 等)は描画に影響しないため捨てる。
 */
import * as lucide from "lucide-react"

type IconPlaceholderProps = {
  lucide?: string
  className?: string
} & Record<string, unknown>

export function IconPlaceholder({ lucide: lucideName, className, ...rest }: IconPlaceholderProps) {
  if (!lucideName) return null
  const Icon = (lucide as Record<string, React.ComponentType<{ className?: string }>>)[lucideName]
  if (!Icon) return null
  return <Icon className={className} {...(rest as { className?: string })} />
}
