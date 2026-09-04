# `breadcrumb` — `Shadcn::Breadcrumb`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/breadcrumb.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/breadcrumb_preview.rb)

現在位置までの階層をナビゲーションとして示す。

## 構成

- 主コンポーネント: `Shadcn::Breadcrumb`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Breadcrumb::List`、`Shadcn::Breadcrumb::Item`
- このitemが公開する任意の補助クラス: `Shadcn::Breadcrumb::Link`、`Shadcn::Breadcrumb::Page`、`Shadcn::Breadcrumb::Separator`、`Shadcn::Breadcrumb::Ellipsis`

各ItemにLinkまたは現在位置のPageを置き、必要に応じてSeparatorやEllipsisを挟む。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Breadcrumb`](../../../app/components/shadcn/breadcrumb.rb#L5) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `breadcrumb` |
| [`Shadcn::Breadcrumb::List`](../../../app/components/shadcn/breadcrumb.rb#L7) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `breadcrumb-list` |
| [`Shadcn::Breadcrumb::Item`](../../../app/components/shadcn/breadcrumb.rb#L9) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `breadcrumb-item` |
| [`Shadcn::Breadcrumb::Link`](../../../app/components/shadcn/breadcrumb.rb#L11) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `breadcrumb-link` |
| [`Shadcn::Breadcrumb::Page`](../../../app/components/shadcn/breadcrumb.rb#L13) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `breadcrumb-page` |
| [`Shadcn::Breadcrumb::Separator`](../../../app/components/shadcn/breadcrumb.rb#L16) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `breadcrumb-separator` |
| [`Shadcn::Breadcrumb::Ellipsis`](../../../app/components/shadcn/breadcrumb.rb#L44) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `breadcrumb-ellipsis` |

## HTML attributesの適用先

- 既定: Shadcn::Breadcrumb
- hrefはLinkへ、aria-current等はPageへ渡す。

## フォーム送信

- 種別: `none`
- フォーム値は送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — 階層と現在位置はサーバ描画で確定する。
- Stimulus: 不要
- browser API: HTML navigation and links
- keyboard: Linkは通常のリンクとしてTabとEnterで操作する。
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- React Slotを使わず公開子ViewComponentを明示的に合成する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/breadcrumb/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/breadcrumb_preview.rb](../../../spec/dummy/app/components/previews/shadcn/breadcrumb_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class BreadcrumbPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Breadcrumb.new) do
        render(Shadcn::Breadcrumb::List.new) do
          safe_join([
            render(Shadcn::Breadcrumb::Item.new) do
              render(Shadcn::Breadcrumb::Link.new(href: "#")) { "Home" }
            end,
            render(Shadcn::Breadcrumb::Separator.new),
            render(Shadcn::Breadcrumb::Item.new) do
              render(Shadcn::Breadcrumb::Link.new(href: "#")) { "記事" }
            end,
            render(Shadcn::Breadcrumb::Separator.new),
            render(Shadcn::Breadcrumb::Item.new) do
              render(Shadcn::Breadcrumb::Page.new) { "現在のページ" }
            end
          ])
        end
      end
    end

    def ellipsis
      render(Shadcn::Breadcrumb.new) do
        render(Shadcn::Breadcrumb::List.new) do
          safe_join([
            render(Shadcn::Breadcrumb::Item.new) { render(Shadcn::Breadcrumb::Link.new(href: "#")) { "Home" } },
            render(Shadcn::Breadcrumb::Item.new) { render(Shadcn::Breadcrumb::Ellipsis.new) },
            render(Shadcn::Breadcrumb::Item.new) { render(Shadcn::Breadcrumb::Page.new) { "現在" } }
          ])
        end
      end
    end
  end
end
```
