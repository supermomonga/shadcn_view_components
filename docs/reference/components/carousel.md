# `carousel` — `Shadcn::Carousel`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/carousel.rb#L9) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/carousel_preview.rb)

横または縦方向にスライドをスクロールするカルーセル。

## 構成

- 主コンポーネント: `Shadcn::Carousel`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Carousel::Content`、`Shadcn::Carousel::Item`
- このitemが公開する任意の補助クラス: `Shadcn::Carousel::Previous`、`Shadcn::Carousel::Next`

PreviousとNextは任意だが、ボタン操作を提供する場合はroot内へ置く。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Carousel`](../../../app/components/shadcn/carousel.rb#L9) | `new(orientation: self.class.property_default(:orientation),<br>                   direction: self.class.property_default(:direction), **args)` | orientation: horizontal, vertical (default: "horizontal")<br>direction: ltr, rtl (default: "ltr") | `carousel` |
| [`Shadcn::Carousel::Content`](../../../app/components/shadcn/carousel.rb#L58) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `carousel-content` |
| [`Shadcn::Carousel::Item`](../../../app/components/shadcn/carousel.rb#L84) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `carousel-item` |
| [`Shadcn::Carousel::Previous`](../../../app/components/shadcn/carousel.rb#L185) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `carousel-previous` |
| [`Shadcn::Carousel::Next`](../../../app/components/shadcn/carousel.rb#L206) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `carousel-next` |

## HTML attributesの適用先

- 既定: Shadcn::Carousel
- viewport属性はContentへ、スライド属性はItemへ、ボタン属性はPreviousまたはNextへ渡す。
- rootはrole=region/aria-roledescription=carousel、Itemはrole=group/aria-roledescription=slideを持つ。

## フォーム送信

- 種別: `none`
- ナビゲーションはtype=buttonでname/valueを送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — スクロール位置はブラウザが保持しStimulusがボタンdisabled状態を同期する。controlled index APIはない。
- Stimulus: `shadcn--carousel`
- browser API: Element.scrollBy / scroll events / CSS scroll snap
- keyboard: 横LTRは左右、横RTLは逆方向の左右、縦は上下矢印で移動する。 / PreviousとNextはbuttonとしてEnterまたはSpaceで操作する。
- CIで確認する操作: `accessibility`、`keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- embla-carouselを使わずネイティブスクロールとscroll snapで再実装する。

### 未対応

- Embla plugin、loop、dragFree、外部carousel API。

## CIで描画する代表例を含むpreview定義

`shadcn/carousel/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/carousel_preview.rb](../../../spec/dummy/app/components/previews/shadcn/carousel_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class CarouselPreview < Shadcn::PreviewBase
    def default
      carousel
    end

    def vertical
      carousel(orientation: :vertical)
    end

    def rtl
      carousel(direction: :rtl)
    end

    private

    def carousel(orientation: :horizontal, direction: :ltr)
      render(Shadcn::Carousel.new(class: "max-w-xs", orientation:, direction:,
                                  aria: { label: "サンプルスライド" })) do
        safe_join([
                    render(Shadcn::Carousel::Content.new(class: orientation == :vertical ? "h-[200px]" : nil)) do
                      safe_join((1..4).map { |number| carousel_item(number) })
                    end,
                    render(Shadcn::Carousel::Previous.new),
                    render(Shadcn::Carousel::Next.new)
                  ])
      end
    end

    def carousel_item(number)
      render(Shadcn::Carousel::Item.new(aria: { label: "#{number} of 4" })) do
        text = "スライド#{number}"
        content_tag(:div, class: "flex size-40 items-center justify-center rounded-md border") { text }
      end
    end
  end
end
```
