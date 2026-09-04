# `table` — `Shadcn::Table`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/table.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/table_preview.rb)

横スクロール用container内にセマンティックなHTML tableを構成する。

## 構成

- 主コンポーネント: `Shadcn::Table`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Table::Body`、`Shadcn::Table::Row`、`Shadcn::Table::Cell`
- このitemが公開する任意の補助クラス: `Shadcn::Table::Header`、`Shadcn::Table::Footer`、`Shadcn::Table::Head`、`Shadcn::Table::Caption`

Header、Footer、Head、Captionは表の内容に応じて追加する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Table`](../../../app/components/shadcn/table.rb#L5) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `table-container`<br>`table` |
| [`Shadcn::Table::Header`](../../../app/components/shadcn/table.rb#L32) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `table-header` |
| [`Shadcn::Table::Body`](../../../app/components/shadcn/table.rb#L34) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `table-body` |
| [`Shadcn::Table::Footer`](../../../app/components/shadcn/table.rb#L36) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `table-footer` |
| [`Shadcn::Table::Head`](../../../app/components/shadcn/table.rb#L38) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `table-head` |
| [`Shadcn::Table::Row`](../../../app/components/shadcn/table.rb#L40) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `table-row` |
| [`Shadcn::Table::Cell`](../../../app/components/shadcn/table.rb#L42) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `table-cell` |
| [`Shadcn::Table::Caption`](../../../app/components/shadcn/table.rb#L44) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `table-caption` |

## HTML attributesの適用先

- 既定: Tableの利用者属性は内側tableへ、外側containerは契約の静的属性だけを持つ。各子クラスの属性は対応するthead/tbody/tfoot/th/tr/td/captionへ渡る。
- Table rootはoverflow-x-autoのdivを自動生成する。

## フォーム送信

- 種別: `none`
- 表自体はname/value/disabledや送信値を持たない。セル内のフォーム部品は各自の規則で送信される。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — 表構造と内容はサーバー描画され、内部controlled/uncontrolled状態はない。
- Stimulus: 不要
- browser API: HTML table semantics / CSS overflow scrolling
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- Reactのtable helper群ではなくHTML table要素群をRubyクラスでサーバー描画する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/table/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/table_preview.rb](../../../spec/dummy/app/components/previews/shadcn/table_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class TablePreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Table.new) do
        safe_join([
          render(Shadcn::Table::Header.new) do
            render(Shadcn::Table::Row.new) do
              safe_join([render(Shadcn::Table::Head.new) { "名前" }, render(Shadcn::Table::Head.new) { "値" }])
            end
          end,
          render(Shadcn::Table::Body.new) do
            safe_join([
              render(Shadcn::Table::Row.new) do
                safe_join([render(Shadcn::Table::Cell.new) { "項目A" }, render(Shadcn::Table::Cell.new) { "1" }])
              end,
              render(Shadcn::Table::Row.new) do
                safe_join([render(Shadcn::Table::Cell.new) { "項目B" }, render(Shadcn::Table::Cell.new) { "2" }])
              end
            ])
          end,
          render(Shadcn::Table::Caption.new) { "キャプション" }
        ])
      end
    end
  end
end
```
