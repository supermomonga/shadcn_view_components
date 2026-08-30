# `switch` — `Shadcn::Switch`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/switch.rb#L5) / [代表preview](../../spec/dummy/app/components/previews/shadcn/switch_preview.rb)

ネイティブcheckboxを状態源にする二値スイッチ。

## 構成

- 主コンポーネント: `Shadcn::Switch`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

inputと表示用thumbはSwitch自身が生成する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Switch`](../../app/components/shadcn/switch.rb#L5) | `new(size: self.class.property_default(:size), **args)` | size: default, sm (default: "default") | `switch`<br>`switch-thumb` |

## HTML attributesの適用先

- 既定: 利用者属性はinput[type=checkbox][role=switch]へ渡る。
- 外側spanとaria-hiddenのthumbは内部生成される。
- sizeはinputのdata-sizeとthumb寸法へ反映される。
- checked状態のdata属性はinputとthumbへ同期される。

## フォーム送信

- 種別: `native`
- name/value/disabled/checkedはcheckboxへ渡る。checkedかつenabledでnameがある場合だけvalue一つを送信し、未選択・disabled・nameなしは送信されない。複数の同名switchは各checked値を複数送信できる。

## 状態・JavaScript・キーボード

- 状態モデル: `native` — input.checkedが唯一の状態源でchange時に装飾を同期する。外部property変更時はbubbling changeが必要で、checked引数はcontrolled APIではない。
- Stimulus: `shadcn--checked-state`
- browser API: HTML checkbox / FormData
- keyboard: Spaceで切り替える。 / Tabでフォーカスする。
- CIで確認する操作: `accessibility`、`form`、`keyboard`、`no_js`、`pointer`、`reconnect`、`reset`、`state`

## upstreamとの差異・未対応機能

### 差異

- React Switch primitiveではなくネイティブcheckboxをフォーム状態源にする。

### 未対応

- 外部controlled checked/onCheckedChange。
- 三状態indeterminate。

## CIで描画する代表例を含むpreview定義

`shadcn/switch/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/switch_preview.rb](../../spec/dummy/app/components/previews/shadcn/switch_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class SwitchPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Switch.new(id: "switch", name: "switch", aria: { label: "通知" }))
    end

    def checked
      render(Shadcn::Switch.new(checked: true, aria: { label: "通知オン" }))
    end

    def unchecked
      render(Shadcn::Switch.new(checked: false, aria: { label: "通知オフ" }))
    end

    def small
      render(Shadcn::Switch.new(size: :sm, name: "switch-sm"))
    end
  end
end
```
