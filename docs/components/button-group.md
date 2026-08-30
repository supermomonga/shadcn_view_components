# `button-group` — `Shadcn::ButtonGroup`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/button_group.rb#L6) / [代表preview](../../spec/dummy/app/components/previews/shadcn/button_group_preview.rb)

関連するボタンを横または縦に一体配置する。

## 構成

- 主コンポーネント: `Shadcn::ButtonGroup`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: `Shadcn::ButtonGroup::Separator`、`Shadcn::ButtonGroup::Text`

Shadcn::Button等の操作要素を内容として並べ、SeparatorやTextを任意に挟む。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::ButtonGroup`](../../app/components/shadcn/button_group.rb#L6) | `new(orientation: ShadcnViewComponents::Contracts::ButtonGroup::DEFAULTS.fetch(:orientation), **args)` | orientation: horizontal, vertical (default: horizontal) | `button-group` |
| [`Shadcn::ButtonGroup::Separator`](../../app/components/shadcn/button_group.rb#L18) | `new(orientation: :vertical, **args)` | orientation: horizontal, vertical (default: :vertical) | `button-group-separator` |
| [`Shadcn::ButtonGroup::Text`](../../app/components/shadcn/button_group.rb#L37) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `button-group-text` |

## HTML attributesの適用先

- 既定: Shadcn::ButtonGroup
- separatorのorientationはShadcn::ButtonGroup::Separatorへ、各操作属性は個々のButtonへ渡す。

## フォーム送信

- 種別: `none`
- rootとSeparatorとTextはフォーム値を送信しない。内包する各buttonの送信契約はButton側が担う。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — orientationはサーバ描画時に確定し、選択状態を管理しない。
- Stimulus: 不要
- browser API: 追加要件なし
- keyboard: 内包する各buttonのネイティブキーボード操作を使う。
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- ButtonGroupSeparatorは標準SeparatorをViewComponentとして合成する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/button_group/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/button_group_preview.rb](../../spec/dummy/app/components/previews/shadcn/button_group_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class ButtonGroupPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::ButtonGroup.new(aria: { label: "表示倍率" })) do
        safe_join([
                    render(Shadcn::Button.new(variant: :outline, size: :sm)) { "縮小" },
                    render(Shadcn::ButtonGroup::Separator.new),
                    render(Shadcn::ButtonGroup::Text.new) { "100%" },
                    render(Shadcn::ButtonGroup::Separator.new),
                    render(Shadcn::Button.new(variant: :outline, size: :sm)) { "拡大" }
                  ])
      end
    end
  end
end
```
