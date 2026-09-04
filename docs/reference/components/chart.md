# `chart` — `Shadcn::Chart::Container`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/chart.rb#L11) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/chart_preview.rb)

サーバ生成したグラフ内容へテーマ、tooltip、legendの表示枠を提供する。

## 構成

- 主コンポーネント: `Shadcn::Chart::Container`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: `Shadcn::Chart::TooltipContent`、`Shadcn::Chart::LegendContent`、`Shadcn::Chart::Style`

TooltipContent、LegendContent、Styleを必要に応じてContainer内または同じ描画領域へ置く。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Chart::Container`](../../../app/components/shadcn/chart.rb#L11) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `chart` |
| [`Shadcn::Chart::TooltipContent`](../../../app/components/shadcn/chart.rb#L28) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | なし |
| [`Shadcn::Chart::LegendContent`](../../../app/components/shadcn/chart.rb#L36) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | なし |
| [`Shadcn::Chart::Style`](../../../app/components/shadcn/chart.rb#L44) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | なし |

## HTML attributesの適用先

- 既定: Shadcn::Chart::Container
- tooltip、legend、styleの属性は各対応classへ渡す。

## フォーム送信

- 種別: `none`
- フォーム値は送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `server` — グラフ本体と系列設定は利用者がサーバ側で描画し、このitemはクライアント状態を管理しない。
- Stimulus: 不要
- browser API: CSS custom properties
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- rechartsを同梱せず、描画内容を受け取るコンテナと静的なtooltip・legend・styleだけを提供する。

### 未対応

- rechartsの描画、hover連動tooltip、系列データの自動legend生成。

## CIで描画する代表例を含むpreview定義

`shadcn/chart/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/chart_preview.rb](../../../spec/dummy/app/components/previews/shadcn/chart_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class ChartPreview < Shadcn::PreviewBase
    def default
      safe_join([
                  render(Shadcn::Chart::Container.new(role: "img", aria: { label: "月別売上" })) do
                    content_tag(:div, "1月 40、2月 65、3月 80", class: "p-4 text-sm")
                  end,
                  render(Shadcn::Chart::LegendContent.new) { "売上（万円）" }
                ])
    end
  end
end
```
