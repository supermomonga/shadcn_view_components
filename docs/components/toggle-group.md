# `toggle-group` — `Shadcn::ToggleGroup`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/toggle_group.rb#L5) / [代表preview](../../spec/dummy/app/components/previews/shadcn/toggle_group_preview.rb)

単一選択または複数選択として複数のtoggle buttonをまとめる。

## 構成

- 主コンポーネント: `Shadcn::ToggleGroup`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::ToggleGroup::Item`
- このitemが公開する任意の補助クラス: なし

rootのtypeがsingleなら排他、multipleなら各Itemを独立して切り替える。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::ToggleGroup`](../../app/components/shadcn/toggle_group.rb#L5) | `new(type: self.class.property_default(:type),<br>                   spacing: self.class.property_default(:spacing), variant: nil, size: nil, **args)` | type: single, multiple (default: "multiple")<br>spacing: number, >= 0 (default: 2)<br>variant: default, outline (default: nil)<br>size: default, lg, sm (default: nil) | `toggle-group` |
| [`Shadcn::ToggleGroup::Item`](../../app/components/shadcn/toggle_group.rb#L64) | `new(variant: ShadcnViewComponents::Contracts::ToggleGroup::Item::DEFAULTS.fetch(:variant),<br>                     size: ShadcnViewComponents::Contracts::ToggleGroup::Item::DEFAULTS.fetch(:size),<br>                     state: self.class.property_default(:state),<br>                     spacing: self.class.property_default(:spacing), **args)` | size: default, lg, sm (default: default)<br>variant: default, outline (default: default)<br>state: off, on (default: "off")<br>spacing: number, >= 0 (default: 2) | `toggle-group-item` |

## HTML attributesの適用先

- 既定: root属性はgroup要素、Item属性は各button。
- rootのtype/variant/size/spacingはdata属性へ出力される。
- Itemはtype=button、data-state、aria-pressedを持つ。

## フォーム送信

- 種別: `none`
- Itemは既定でtype=buttonのためフォームを送信しない。name/value/disabledはbutton属性として渡せるが、未選択・選択・複数選択をhidden値へ変換する機能はない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — 各ItemのstateはSSR初期値で、接続後はStimulusがsingleの排他またはmultipleの独立状態を管理する。外部controlled値配列はない。
- Stimulus: `shadcn--toggle-group`
- browser API: ARIA pressed button
- keyboard: 各ItemはEnter/Spaceのbutton標準clickで切り替わる。
- CIで確認する操作: `keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- React contextではなくrootのdata-typeと各buttonのdata-stateをStimulusが管理する。

### 未対応

- 選択値のフォーム送信。
- 外部controlled value/onValueChange。

## CIで描画する代表例を含むpreview定義

`shadcn/toggle_group/single` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/toggle_group_preview.rb](../../spec/dummy/app/components/previews/shadcn/toggle_group_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class ToggleGroupPreview < Shadcn::PreviewBase
    def multiple
      render(Shadcn::ToggleGroup.new(variant: :outline)) do
        safe_join([
          render(Shadcn::ToggleGroup::Item.new(state: :on, variant: :outline)) { "太字" },
          render(Shadcn::ToggleGroup::Item.new(variant: :outline)) { "斜体" },
          render(Shadcn::ToggleGroup::Item.new(variant: :outline)) { "下線" }
        ])
      end
    end

    def single
      render(Shadcn::ToggleGroup.new(type: :single, variant: :outline)) do
        safe_join([
          render(Shadcn::ToggleGroup::Item.new(state: :on, variant: :outline, size: :sm)) { "日" },
          render(Shadcn::ToggleGroup::Item.new(variant: :outline, size: :sm)) { "週" },
          render(Shadcn::ToggleGroup::Item.new(variant: :outline, size: :sm)) { "月" }
        ])
      end
    end
  end
end
```
