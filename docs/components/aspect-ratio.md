# `aspect-ratio` — `Shadcn::AspectRatio`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/aspect_ratio.rb#L5) / [代表preview](../../spec/dummy/app/components/previews/shadcn/aspect_ratio_preview.rb)

指定比率をCSS aspect-ratioで維持するコンテナ。

## 構成

- 主コンポーネント: `Shadcn::AspectRatio`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

表示内容をrootのブロックとして渡す。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::AspectRatio`](../../app/components/shadcn/aspect_ratio.rb#L5) | `new(ratio: self.class.property_default(:ratio), **args)` | ratio: number, > 0, nil可 (default: nil) | `aspect-ratio` |

## HTML attributesの適用先

- 既定: Shadcn::AspectRatio
- 例外なし。

## フォーム送信

- 種別: `none`
- フォーム値は送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — ratioはサーバ描画時にstyleへ変換される。
- Stimulus: 不要
- browser API: CSS aspect-ratio
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- React primitiveを使わずネイティブCSSのaspect-ratioを出力する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/aspect_ratio/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/aspect_ratio_preview.rb](../../spec/dummy/app/components/previews/shadcn/aspect_ratio_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class AspectRatioPreview < Shadcn::PreviewBase
    def default
      # ratio はCSS aspect-ratio に渡す有限の正数(厳密な数値文字列も可)。Rational は契約外
      render(Shadcn::AspectRatio.new(ratio: 16.0 / 9, class: "bg-muted")) { "16 / 9" }
    end
  end
end
```
