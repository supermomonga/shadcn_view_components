# `spinner` — `Shadcn::Spinner`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/spinner.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/spinner_preview.rb)

処理中を示す回転するインラインSVGアイコン。

## 構成

- 主コンポーネント: `Shadcn::Spinner`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

単一SVGで完結する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Spinner`](../../../app/components/shadcn/spinner.rb#L5) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `spinner` |

## HTML attributesの適用先

- 既定: Spinnerが描画するsvg要素。
- viewBox、stroke、既定寸法とloader-circleのpathはコンポーネントが生成する。

## フォーム送信

- 種別: `none`
- 表示専用でname/value/disabledや送信値を持たない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — 回転はCSS表現で、controlled/uncontrolled状態はない。
- Stimulus: 不要
- browser API: SVG
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- Lucide Reactアイコンではなく同等のpathを持つインラインSVGをRubyで描画する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/spinner/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/spinner_preview.rb](../../../spec/dummy/app/components/previews/shadcn/spinner_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class SpinnerPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Spinner.new)
    end

    def large
      render(Shadcn::Spinner.new(class: "size-8"))
    end
  end
end
```
