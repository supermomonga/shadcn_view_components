# `scroll-area` — `Shadcn::ScrollArea`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/scroll_area.rb#L5) / [代表preview](../../spec/dummy/app/components/previews/shadcn/scroll_area_preview.rb)

ネイティブCSSスクロール領域をshadcnの構造と外観で表示する。

## 構成

- 主コンポーネント: `Shadcn::ScrollArea`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: `Shadcn::ScrollArea::Scrollbar`

viewportはrootが自動生成し、Scrollbarは契約構造を必要とする場合だけ追加する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::ScrollArea`](../../app/components/shadcn/scroll_area.rb#L5) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `scroll-area`<br>`scroll-area-viewport` |
| [`Shadcn::ScrollArea::Scrollbar`](../../app/components/shadcn/scroll_area.rb#L24) | `new(orientation: self.class.property_default(:orientation), **args)` | orientation: horizontal, vertical (default: "vertical") | `scroll-area-scrollbar`<br>`scroll-area-thumb` |

## HTML attributesの適用先

- 既定: 利用者属性は外側のrootへ、スクロール対象の内容は自動生成viewport内へ入る。
- Scrollbarは装飾構造のみで、実際のスクロール操作はviewportのoverflow-autoが担う。

## フォーム送信

- 種別: `none`
- フォームコントロールではなくname/value/disabledや送信値を持たない。

## 状態・JavaScript・キーボード

- 状態モデル: `native` — scrollTop/scrollLeftはブラウザが管理し、controlled/uncontrolled用の値APIはない。
- Stimulus: 不要
- browser API: CSS overflow scrolling
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- Radixのカスタムスクロールバー動作ではなくネイティブoverflowを使用する。

### 未対応

- Scrollbar/Thumbによる独自ドラッグ状態管理。
- 自動生成viewportへtabindexやARIA属性を直接渡すAPI。

## CIで描画する代表例を含むpreview定義

`shadcn/scroll_area/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/scroll_area_preview.rb](../../spec/dummy/app/components/previews/shadcn/scroll_area_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class ScrollAreaPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::ScrollArea.new(class: "h-48")) do
        safe_join(Array.new(20) { |i| content_tag(:div, "行 #{i + 1}", class: "p-2") })
      end
    end
  end
end
```
