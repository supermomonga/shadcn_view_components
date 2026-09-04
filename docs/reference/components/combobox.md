# `combobox` — `Shadcn::Combobox`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/combobox.rb#L23) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/combobox_preview.rb)

候補の絞り込みと単一または複数選択を行うフォーム部品。

## 構成

- 主コンポーネント: `Shadcn::Combobox`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Combobox::Input`、`Shadcn::Combobox::Content`、`Shadcn::Combobox::List`、`Shadcn::Combobox::Item`
- このitemが公開する任意の補助クラス: `Shadcn::Combobox::Trigger`、`Shadcn::Combobox::Group`、`Shadcn::Combobox::Label`、`Shadcn::Combobox::Empty`、`Shadcn::Combobox::Separator`、`Shadcn::Combobox::Collection`、`Shadcn::Combobox::Value`、`Shadcn::Combobox::Chips`、`Shadcn::Combobox::Chip`、`Shadcn::Combobox::ChipsInput`

Itemにはvalueが必須。複数選択の表示にはChips、Chip、ChipsInputを利用できる。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Combobox`](../../../app/components/shadcn/combobox.rb#L23) | `new(name: nil, default_value: nil, multiple: false, disabled: false, required: false, form: nil, **args)` | 追加制約なし（signatureどおり） | なし |
| [`Shadcn::Combobox::Input`](../../../app/components/shadcn/combobox.rb#L155) | `new(**args)` | 追加制約なし（signatureどおり） | `input-group-button` |
| [`Shadcn::Combobox::Trigger`](../../../app/components/shadcn/combobox.rb#L270) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `combobox-trigger` |
| [`Shadcn::Combobox::Content`](../../../app/components/shadcn/combobox.rb#L314) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `combobox-content` |
| [`Shadcn::Combobox::List`](../../../app/components/shadcn/combobox.rb#L327) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `combobox-list` |
| [`Shadcn::Combobox::Item`](../../../app/components/shadcn/combobox.rb#L331) | `new(value:, disabled: false, **args)` | 追加制約なし（signatureどおり） | `combobox-item` |
| [`Shadcn::Combobox::Group`](../../../app/components/shadcn/combobox.rb#L412) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `combobox-group` |
| [`Shadcn::Combobox::Label`](../../../app/components/shadcn/combobox.rb#L416) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `combobox-label` |
| [`Shadcn::Combobox::Empty`](../../../app/components/shadcn/combobox.rb#L420) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `combobox-empty` |
| [`Shadcn::Combobox::Separator`](../../../app/components/shadcn/combobox.rb#L427) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `combobox-separator` |
| [`Shadcn::Combobox::Collection`](../../../app/components/shadcn/combobox.rb#L431) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `combobox-collection` |
| [`Shadcn::Combobox::Value`](../../../app/components/shadcn/combobox.rb#L435) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `combobox-value` |
| [`Shadcn::Combobox::Chips`](../../../app/components/shadcn/combobox.rb#L439) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `combobox-chips` |
| [`Shadcn::Combobox::Chip`](../../../app/components/shadcn/combobox.rb#L457) | `new(value:, **args)` | 追加制約なし（signatureどおり） | `combobox-chip`<br>`combobox-chip-remove` |
| [`Shadcn::Combobox::ChipsInput`](../../../app/components/shadcn/combobox.rb#L522) | `new(**args)` | 追加制約なし（signatureどおり） | `combobox-chip-input` |

## HTML attributesの適用先

- 既定: Shadcn::Combobox
- 入力属性はInputまたはChipsInputへ、候補値とdisabledはItemへ渡す。name/default_value/multiple/required/form/disabledはrootのフォーム契約。
- 入力はrole=comboboxとaria-expanded、候補一覧はrole=listbox、Itemはrole=optionとaria-selected/aria-disabledを持つ。

## フォーム送信

- 種別: `composite`
- 表示UIとは別にrootが送信用selectを生成する。name指定時、単一選択はname=選択値を一件、未選択はname=空文字列を送信する。multipleは選択値ごとに同じnameで複数件を送り、未選択時は補助hidden inputがname=空文字列を一件送信する。disabled時はselectと補助inputのどちらも送信しない。requiredとformはselectへ反映する。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — default_valueは初期値のみで、以後の選択値、候補表示、filter、chipはStimulusとhidden selectが保持する。controlled value APIはない。
- Stimulus: `shadcn--combobox`
- browser API: Popover API / HTML select element / form reset
- keyboard: 入力中の上下矢印で候補を移動する。 / Enterで選択する。 / Escapeで候補を閉じる。 / 複数選択ではBackspaceで直前chipを削除する。
- CIで確認する操作: `form`、`keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- Base UI Combobox primitiveの代わりに入力、Popover API listbox、hidden selectを合成する。

### 未対応

- controlled valueとonValueChange、仮想化、非文字列フォーム値。

## CIで描画する代表例を含むpreview定義

`shadcn/combobox/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/combobox_preview.rb](../../../spec/dummy/app/components/previews/shadcn/combobox_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class ComboboxPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Combobox.new) do
        safe_join([
          render(Shadcn::Combobox::Input.new(placeholder: "フレームワークを検索…")),
          render(Shadcn::Combobox::Content.new) do
            render(Shadcn::Combobox::List.new) do
              safe_join([
                render(Shadcn::Combobox::Empty.new) { "見つかりません" },
                render(Shadcn::Combobox::Item.new(value: "rails")) { "Ruby on Rails" },
                render(Shadcn::Combobox::Item.new(value: "hanami")) { "Hanami" },
                render(Shadcn::Combobox::Item.new(value: "sinatra")) { "Sinatra" }
              ])
            end
          end
        ])
      end
    end

    def chips
      render(Shadcn::Combobox.new(default_value: %w[rails hanami], multiple: true)) do
        render(Shadcn::Combobox::Chips.new) do
          safe_join([
            render(Shadcn::Combobox::Chip.new(value: "rails")) { "Rails" },
            render(Shadcn::Combobox::Chip.new(value: "hanami")) { "Hanami" },
            render(Shadcn::Combobox::ChipsInput.new(placeholder: "追加…"))
          ])
        end
      end
    end
  end
end
```
