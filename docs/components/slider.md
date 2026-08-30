# `slider` — `Shadcn::Slider`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/slider.rb#L8) / [代表preview](../../spec/dummy/app/components/previews/shadcn/slider_preview.rb)

ネイティブrange inputを状態源にする単一値スライダー。

## 構成

- 主コンポーネント: `Shadcn::Slider`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

track、range、thumb、inputはSlider自身が生成する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Slider`](../../app/components/shadcn/slider.rb#L8) | `new(min: self.class.property_default(:min), # rubocop:disable Metrics/ParameterLists<br>                   max: self.class.property_default(:max),<br>                   step: self.class.property_default(:step),<br>                   value: self.class.property_default(:value),<br>                   orientation: self.class.property_default(:orientation), **args)` | min: number (default: 0)<br>max: number (default: 100)<br>step: number, > 0 (default: 1)<br>value: number, nil可 (default: nil)<br>orientation: horizontal, vertical (default: "horizontal") | `slider`<br>`slider-track`<br>`slider-range`<br>`slider-thumb` |

## HTML attributesの適用先

- 既定: class/style/tagは外側root、それ以外の利用者HTML属性は実際のinput[type=range]。
- min/max/step/value/orientationは検証後にinputと装飾位置へ反映され、aria-orientationも同期する。
- inputのclassは操作面を成立させる内部classに固定される。
- aria-label/aria-labelledby等の利用者ARIA属性は実range inputへ渡る。

## フォーム送信

- 種別: `native`
- name/value/disabledはrange inputへ渡り、enabledかつnameありなら現在値一つを送信する。disabledまたはnameなしは送信されず、未指定valueはブラウザのrange既定値になる。複数値送信は非対応。

## 状態・JavaScript・キーボード

- 状態モデル: `native` — input.valueが唯一の状態源で、input/change時に装飾を同期する。value引数は初期値であり外部controlled更新APIではない。
- Stimulus: `shadcn--slider`
- browser API: HTML input type=range / FormData
- keyboard: Arrowキー、PageUp/PageDown、Home/Endはrange inputのブラウザ標準動作。
- CIで確認する操作: `accessibility`、`form`、`keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- React slider primitiveではなく透明なネイティブrange inputを操作面と状態源にする。

### 未対応

- 複数thumbのrange選択。
- 外部controlled配列値/onValueChange。

## CIで描画する代表例を含むpreview定義

`shadcn/slider/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/slider_preview.rb](../../spec/dummy/app/components/previews/shadcn/slider_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class SliderPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Slider.new(min: 0, max: 100, value: 40, aria: { label: "音量" }))
    end

    def vertical
      render(
        Shadcn::Slider.new(
          min: 0,
          max: 100,
          value: 40,
          orientation: :vertical,
          style: "height: 160px",
          aria: { label: "音量" }
        )
      )
    end
  end
end
```
