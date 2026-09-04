# `card` — `Shadcn::Card`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/card.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/card_preview.rb)

見出し、本文、操作、フッターをまとめる静的カード。

## 構成

- 主コンポーネント: `Shadcn::Card`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: `Shadcn::Card::Header`、`Shadcn::Card::Title`、`Shadcn::Card::Description`、`Shadcn::Card::Action`、`Shadcn::Card::Content`、`Shadcn::Card::Footer`

Header、Title、Description、Action、Content、Footerを必要な部分だけ組み合わせる。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Card`](../../../app/components/shadcn/card.rb#L5) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `card` |
| [`Shadcn::Card::Header`](../../../app/components/shadcn/card.rb#L6) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `card-header` |
| [`Shadcn::Card::Title`](../../../app/components/shadcn/card.rb#L8) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `card-title` |
| [`Shadcn::Card::Description`](../../../app/components/shadcn/card.rb#L10) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `card-description` |
| [`Shadcn::Card::Action`](../../../app/components/shadcn/card.rb#L12) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `card-action` |
| [`Shadcn::Card::Content`](../../../app/components/shadcn/card.rb#L14) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `card-content` |
| [`Shadcn::Card::Footer`](../../../app/components/shadcn/card.rb#L16) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `card-footer` |

## HTML attributesの適用先

- 既定: Shadcn::Card
- 各領域固有の属性は対応する子classへ渡す。

## フォーム送信

- 種別: `none`
- コンポーネント自身はフォーム値を送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — 内部状態を持たない。
- Stimulus: 不要
- browser API: 追加要件なし
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- Reactコンポーネントの代わりに明示的な子ViewComponentを合成する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/card/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/card_preview.rb](../../../spec/dummy/app/components/previews/shadcn/card_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class CardPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Card.new) do
        safe_join([
          render(Shadcn::Card::Header.new) do
            safe_join([render(Shadcn::Card::Title.new) { "カードタイトル" }, render(Shadcn::Card::Description.new) { "説明" }])
          end,
          render(Shadcn::Card::Content.new) { "本文" },
          render(Shadcn::Card::Footer.new) { "フッター" }
        ])
      end
    end

    def with_action
      render(Shadcn::Card.new) do
        safe_join([
          render(Shadcn::Card::Header.new) do
            safe_join([
              render(Shadcn::Card::Title.new) { "タイトル" },
              render(Shadcn::Card::Action.new) { render(Shadcn::Button.new(variant: :ghost, size: :sm)) { "編集" } }
            ])
          end,
          render(Shadcn::Card::Content.new) { "本文" }
        ])
      end
    end
  end
end
```
