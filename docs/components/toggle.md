# `toggle` — `Shadcn::Toggle`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/toggle.rb#L5) / [代表preview](../../spec/dummy/app/components/previews/shadcn/toggle_preview.rb)

aria-pressedとdata-stateを切り替える二値button。

## 構成

- 主コンポーネント: `Shadcn::Toggle`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

単一buttonで完結する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Toggle`](../../app/components/shadcn/toggle.rb#L5) | `new(variant: ShadcnViewComponents::Contracts::Toggle::DEFAULTS.fetch(:variant),<br>                   size: ShadcnViewComponents::Contracts::Toggle::DEFAULTS.fetch(:size),<br>                   state: self.class.property_default(:state), **args)` | size: default, lg, sm (default: default)<br>variant: default, outline (default: default)<br>state: off, on (default: "off") | `toggle` |

## HTML attributesの適用先

- 既定: Shadcn::Toggleが描画するbutton。
- typeは既定でbutton。
- stateはdata-stateとaria-pressedの初期値へ反映される。

## フォーム送信

- 種別: `none`
- 既定のtype=buttonではフォームを送信しない。name/value/disabledはbutton属性として渡せるが、Toggle独自の選択値送信はなく、typeをsubmitへ明示変更した場合のみ通常のbutton送信規則に従う。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — stateはSSR初期値で、接続後はStimulusがon/offとaria-pressedを管理する。外部controlled pressedはない。
- Stimulus: `shadcn--toggle`
- browser API: ARIA pressed button
- keyboard: Enter/Spaceのbutton標準clickで切り替える。
- CIで確認する操作: `keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- React Toggle primitiveではなくbuttonのdata-stateをStimulusが直接切り替える。

### 未対応

- 外部controlled pressed/onPressedChange。

## CIで描画する代表例を含むpreview定義

`shadcn/toggle/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/toggle_preview.rb](../../spec/dummy/app/components/previews/shadcn/toggle_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class TogglePreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Toggle.new) { "トグル" }
    end

    def variants
      safe_join(%i[default outline].map do |variant|
        render(Shadcn::Toggle.new(variant: variant)) { variant.to_s }
      end)
    end

    def sizes
      safe_join(%i[sm default lg].map do |size|
        render(Shadcn::Toggle.new(size: size)) { size.to_s }
      end)
    end

    def pressed
      render(Shadcn::Toggle.new(state: :on, variant: :outline)) { "オン" }
    end
  end
end
```
