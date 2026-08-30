# `radio-group` — `Shadcn::RadioGroup`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/radio_group.rb#L5) / [代表preview](../../spec/dummy/app/components/previews/shadcn/radio_group_preview.rb)

同じnameを共有するネイティブラジオ入力を視覚的にグループ化する。

## 構成

- 主コンポーネント: `Shadcn::RadioGroup`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::RadioGroup::Item`
- このitemが公開する任意の補助クラス: なし

各Itemが実際のinput[type=radio]を描画し、rootはrole=radiogroupの配置コンテナになる。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::RadioGroup`](../../app/components/shadcn/radio_group.rb#L5) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `radio-group` |
| [`Shadcn::RadioGroup::Item`](../../app/components/shadcn/radio_group.rb#L15) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `radio-group-item`<br>`radio-group-indicator` |

## HTML attributesの適用先

- 既定: rootの属性はradiogroup要素、Itemの属性はネイティブradio input。
- rootはrole=radiogroupを持つ。Itemは表示用spanとaria-hiddenのindicatorでinputを包むが、利用者のARIA属性は実radio inputへ渡る。
- checked状態のdata属性はinputとindicatorへ同期される。

## フォーム送信

- 種別: `native`
- Itemのname/value/disabled/checkedはネイティブradioに渡る。同一フォーム・同一非空nameでは一つだけ選択され、未選択またはdisabledのItemは送信されず、選択Itemのvalue一つだけが送信される。

## 状態・JavaScript・キーボード

- 状態モデル: `native` — input.checkedが唯一の状態源。初期checked後はブラウザが管理し、changeで装飾を同期する。外部からpropertyを変更した場合はbubbling changeが必要。
- Stimulus: `shadcn--checked-state`
- browser API: HTML radio button grouping / FormData
- keyboard: 同名radio間の矢印キー移動と選択はブラウザ標準動作。 / Spaceでフォーカス中のItemを選択する。
- CIで確認する操作: `accessibility`、`form`、`keyboard`、`no_js`、`pointer`、`reconnect`、`reset`、`state`

## upstreamとの差異・未対応機能

### 差異

- React radio primitiveではなくネイティブinput[type=radio]をフォーム状態源にする。

### 未対応

- 外部controlled value/onValueChange。

## CIで描画する代表例を含むpreview定義

`shadcn/radio_group/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/radio_group_preview.rb](../../spec/dummy/app/components/previews/shadcn/radio_group_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class RadioGroupPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::RadioGroup.new(aria: { label: "プラン" })) do
        safe_join([
                    render(Shadcn::RadioGroup::Item.new(name: "plan", value: "free", aria: { label: "無料" })),
                    render(Shadcn::RadioGroup::Item.new(name: "plan", value: "pro", aria: { label: "プロ" }))
                  ])
      end
    end

    def checked
      render_item(checked: true, label: "選択済みプラン")
    end

    def unchecked
      render_item(checked: false, label: "未選択プラン")
    end

    private

    def render_item(checked:, label:)
      render(Shadcn::RadioGroup.new(aria: { label: "プラン" })) do
        render(Shadcn::RadioGroup::Item.new(name: "preview-plan", value: "pro", checked:, aria: { label: }))
      end
    end
  end
end
```
