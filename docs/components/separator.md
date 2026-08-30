# `separator` — `Shadcn::Separator`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/separator.rb#L5) / [代表preview](../../spec/dummy/app/components/previews/shadcn/separator_preview.rb)

水平または垂直の区切りをARIA separatorとして表示する。

## 構成

- 主コンポーネント: `Shadcn::Separator`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

単一要素で完結する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Separator`](../../app/components/shadcn/separator.rb#L5) | `new(orientation: self.class.property_default(:orientation), **args)` | orientation: horizontal, vertical (default: "horizontal") | `separator` |

## HTML attributesの適用先

- 既定: role=separatorを持つroot要素。
- orientationはdata-orientationとaria-orientationへ反映される。
- 利用者がroleを指定した場合は上書きしない。

## フォーム送信

- 種別: `none`
- 装飾・構造要素でありname/value/disabledや送信値を持たない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — orientationはサーバー描画時に確定し、ブラウザ側状態はない。
- Stimulus: 不要
- browser API: ARIA separator semantics
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- React primitiveではなくroleとaria-orientationを持つ単一のdivをサーバー描画する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/separator/horizontal` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/separator_preview.rb](../../spec/dummy/app/components/previews/shadcn/separator_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class SeparatorPreview < Shadcn::PreviewBase
    def horizontal
      render(Shadcn::Separator.new)
    end

    def vertical
      render(Shadcn::Separator.new(orientation: :vertical, class: "h-8"))
    end
  end
end
```
