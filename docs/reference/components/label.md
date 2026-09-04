# `label` — `Shadcn::Label`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/label.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/label_preview.rb)

for属性で実フォームコントロールへ関連付ける装飾済みネイティブlabel。

## 構成

- 主コンポーネント: `Shadcn::Label`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

ラベル文字列をブロックへ渡し、対象コントロールのidと一致するfor:を指定する。コントロールを内包するHTML構成もネイティブlabelとして利用できる。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Label`](../../../app/components/shadcn/label.rb#L5) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `label` |

## HTML attributesの適用先

- 既定: 実際のlabel要素。
- 例外なし。

## フォーム送信

- 種別: `none`
- label自体は成功コントロールではなくname/value/disabledや送信値を持たない。関連付けたコントロールの未入力・複数値送信には介入しない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — 関連付けはSSRしたfor/idで決まり、controlled/uncontrolled状態はない。
- Stimulus: 不要
- browser API: Native label/control association
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- Base UI LabelPrimitiveではなく、単一のネイティブlabelとして描画する。

### 未対応

- render prop/asChildによる別要素への置換。

## CIで描画する代表例を含むpreview定義

`shadcn/label/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/label_preview.rb](../../../spec/dummy/app/components/previews/shadcn/label_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class LabelPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Label.new) { "ラベル" }
    end

    def with_input
      safe_join([render(Shadcn::Label.new(for: "preview-email")) { "メール" },
                 render(Shadcn::Input.new(id: "preview-email", type: :email))])
    end
  end
end
```
