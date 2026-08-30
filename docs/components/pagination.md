# `pagination` — `Shadcn::Pagination`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/pagination.rb#L9) / [代表preview](../../spec/dummy/app/components/previews/shadcn/pagination_preview.rb)

通常のa要素でページ遷移する、JavaScript不要のページネーション。

## 構成

- 主コンポーネント: `Shadcn::Pagination`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Pagination::Content`、`Shadcn::Pagination::Item`、`Shadcn::Pagination::Link`
- このitemが公開する任意の補助クラス: `Shadcn::Pagination::Previous`、`Shadcn::Pagination::Next`、`Shadcn::Pagination::Ellipsis`

Content内へItemを並べ、各ItemへLink、Previous、Next、Ellipsisのいずれかを置く。現在ページはLinkのis_active: trueで示す。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Pagination`](../../app/components/shadcn/pagination.rb#L9) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `pagination` |
| [`Shadcn::Pagination::Content`](../../app/components/shadcn/pagination.rb#L44) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `pagination-content` |
| [`Shadcn::Pagination::Item`](../../app/components/shadcn/pagination.rb#L48) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `pagination-item` |
| [`Shadcn::Pagination::Link`](../../app/components/shadcn/pagination.rb#L52) | `new(is_active: nil, size: :icon, **args)` | size: default, icon, icon-lg, icon-sm, icon-xs, lg, sm, xs (default: :icon) | `pagination-link` |
| [`Shadcn::Pagination::Previous`](../../app/components/shadcn/pagination.rb#L92) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | なし |
| [`Shadcn::Pagination::Next`](../../app/components/shadcn/pagination.rb#L119) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | なし |
| [`Shadcn::Pagination::Ellipsis`](../../app/components/shadcn/pagination.rb#L145) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `pagination-ellipsis` |

## HTML attributesの適用先

- 既定: 各公開クラスが描く自身のdata-slot要素。
- Linkは実a要素へButton契約のvariant/sizeクラスを合成し、is_active:をdata-activeとaria-current=pageへ反映する。
- Previous/Nextの利用者属性は内部のPagination::Linkへ渡り、既定aria-label、SVG、表示ラベルを加える。
- EllipsisはSVGとsr-onlyラベルを自動生成する。

## フォーム送信

- 種別: `none`
- Link/Previous/Nextはa要素でフォーム送信を行わず、name/value/disabled、未選択、複数値の送信契約を持たない。無効化が必要ならhrefを出さない等を利用者が決める。

## 状態・JavaScript・キーボード

- 状態モデル: `server` — hrefとis_activeはサーバー描画時に決まり、現在ページのcontrolled/uncontrolledクライアント状態は持たない。遷移後はサーバーが次のPaginationを描画する。
- Stimulus: 不要
- browser API: Native anchor navigation
- keyboard: Tabでリンク間を移動し、Enterでhrefへ遷移する。
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- ReactのPaginationLink render propではなく、Buttonクラスを合成した実a要素をSSRする。
- Previous/Next/EllipsisのLucide相当SVGをRuby側で直接描画する。

### 未対応

- クライアントルーターとの自動統合。

## CIで描画する代表例を含むpreview定義

`shadcn/pagination/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/pagination_preview.rb](../../spec/dummy/app/components/previews/shadcn/pagination_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class PaginationPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Pagination.new) do
        render(Shadcn::Pagination::Content.new) do
          safe_join([
            render(Shadcn::Pagination::Item.new) { render(Shadcn::Pagination::Previous.new(href: "#")) },
            render(Shadcn::Pagination::Item.new) do
              render(Shadcn::Pagination::Link.new(href: "#")) { "1" }
            end,
            render(Shadcn::Pagination::Item.new) do
              render(Shadcn::Pagination::Link.new(href: "#", is_active: true)) { "2" }
            end,
            render(Shadcn::Pagination::Item.new) do
              render(Shadcn::Pagination::Link.new(href: "#")) { "3" }
            end,
            render(Shadcn::Pagination::Item.new) { render(Shadcn::Pagination::Ellipsis.new) },
            render(Shadcn::Pagination::Item.new) { render(Shadcn::Pagination::Next.new(href: "#")) }
          ])
        end
      end
    end
  end
end
```
