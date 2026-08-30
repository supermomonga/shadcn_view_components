# `item` — `Shadcn::Item`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/item.rb#L5) / [代表preview](../../spec/dummy/app/components/previews/shadcn/item_preview.rb)

媒体、本文、操作、見出し、区切りを組み立てる汎用リスト項目レイアウト。

## 構成

- 主コンポーネント: `Shadcn::Item`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Item::Content`
- このitemが公開する任意の補助クラス: `Shadcn::Item::Media`、`Shadcn::Item::Actions`、`Shadcn::Item::Group`、`Shadcn::Item::Separator`、`Shadcn::Item::Title`、`Shadcn::Item::Description`、`Shadcn::Item::Header`、`Shadcn::Item::Footer`

Content内へTitle/Descriptionを置き、Media、Actions、Header、Footerを必要に応じて加える。複数項目はGroupで囲み、Separatorを間に置ける。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Item`](../../app/components/shadcn/item.rb#L5) | `new(variant: ShadcnViewComponents::Contracts::Item::DEFAULTS.fetch(:variant),<br>                   size: ShadcnViewComponents::Contracts::Item::DEFAULTS.fetch(:size), **args)` | size: default, sm, xs (default: default)<br>variant: default, muted, outline (default: default) | `item` |
| [`Shadcn::Item::Media`](../../app/components/shadcn/item.rb#L38) | `new(variant: ShadcnViewComponents::Contracts::Item::Media::DEFAULTS.fetch(:variant), **args)` | variant: default, icon, image (default: default) | `item-media` |
| [`Shadcn::Item::Content`](../../app/components/shadcn/item.rb#L94) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `item-content` |
| [`Shadcn::Item::Actions`](../../app/components/shadcn/item.rb#L96) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `item-actions` |
| [`Shadcn::Item::Group`](../../app/components/shadcn/item.rb#L98) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `item-group` |
| [`Shadcn::Item::Separator`](../../app/components/shadcn/item.rb#L68) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `item-separator` |
| [`Shadcn::Item::Title`](../../app/components/shadcn/item.rb#L100) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `item-title` |
| [`Shadcn::Item::Description`](../../app/components/shadcn/item.rb#L102) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `item-description` |
| [`Shadcn::Item::Header`](../../app/components/shadcn/item.rb#L104) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `item-header` |
| [`Shadcn::Item::Footer`](../../app/components/shadcn/item.rb#L106) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `item-footer` |

## HTML attributesの適用先

- 既定: 各公開クラスが描く自身のdata-slot要素。
- Itemのvariant:/size:とMediaのvariant:はdata属性と契約クラスへ反映される。
- Item::SeparatorはSeparator契約クラスを合成したrole=separator要素を描く。

## フォーム送信

- 種別: `none`
- 表示専用でname/value/disabledや送信値を持たない。Actions内のボタンやリンクは各自の契約に従う。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — variant/sizeと内容はSSR時に固定され、controlled/uncontrolled状態はない。
- Stimulus: 不要
- browser API: 追加要件なし
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- ReactのItem合成を、明示的なViewComponent子クラスとサーバー描画variantで提供する。
- Item::Separatorは別itemのSeparatorクラスをRuby側で合成する。

### 未対応

- render prop/asChildによる任意要素への置換。

## CIで描画する代表例を含むpreview定義

`shadcn/item/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/item_preview.rb](../../spec/dummy/app/components/previews/shadcn/item_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class ItemPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Item::Group.new) do
        safe_join([
          render(Shadcn::Item.new) do
            safe_join([render(Shadcn::Item::Media.new) { "🔑" },
                       render(Shadcn::Item::Content.new) do
                         safe_join([render(Shadcn::Item::Title.new) { "タイトル" }, render(Shadcn::Item::Description.new) { "説明" }])
                       end])
          end,
          render(Shadcn::Item::Separator.new),
          render(Shadcn::Item.new(variant: :muted, size: :sm)) do
            render(Shadcn::Item::Content.new) { "ミュート項目" }
          end
        ])
      end
    end
  end
end
```
