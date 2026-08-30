# `direction` — `Shadcn::DirectionProvider`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/direction_provider.rb#L6) / [代表preview](../../spec/dummy/app/components/previews/shadcn/direction_preview.rb)

子要素へ書字方向を適用する、dir属性付きのサーバーレンダリングスコープ。

## 構成

- 主コンポーネント: `Shadcn::DirectionProvider`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

Shadcn::DirectionProviderのブロックへ任意の公開コンポーネントを置く。専用の子コンポーネントはない。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::DirectionProvider`](../../app/components/shadcn/direction_provider.rb#L6) | `new(dir: self.class.property_default(:dir), **args)` | dir: ltr, rtl (default: "ltr") | なし |

## HTML attributesの適用先

- 既定: Shadcn::DirectionProviderが描くルートdiv。
- dir:は契約で許可されたltr/rtlを正規化してルートdivのdir属性へ設定する。

## フォーム送信

- 種別: `none`
- フォームコントロールを描かず、name/value/disabledや送信値を持たない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — dirはサーバー描画時に確定し、クライアント側のcontrolled/uncontrolled状態はない。
- Stimulus: 不要
- browser API: HTML dir attribute and CSS writing-direction inheritance
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- Reactの方向コンテキストではなく、実DOMのdiv[dir]で子孫へ方向を継承する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/direction/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/direction_preview.rb](../../spec/dummy/app/components/previews/shadcn/direction_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class DirectionPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::DirectionProvider.new(dir: :rtl)) { "右から左へ読む文章" }
    end
  end
end
```
