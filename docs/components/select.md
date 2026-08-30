# `select` — `Shadcn::Select`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/select.rb#L8) / [代表preview](../../spec/dummy/app/components/previews/shadcn/select_preview.rb)

hidden inputへ単一の確定値を保持するカスタムcombobox/listbox。

## 構成

- 主コンポーネント: `Shadcn::Select`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Select::Trigger`、`Shadcn::Select::Value`、`Shadcn::Select::Content`、`Shadcn::Select::Item`
- このitemが公開する任意の補助クラス: `Shadcn::Select::Group`、`Shadcn::Select::Label`、`Shadcn::Select::Separator`、`Shadcn::Select::ScrollUpButton`、`Shadcn::Select::ScrollDownButton`

Group、Label、Separator、ScrollUpButton、ScrollDownButtonは任意。Contentはスクロールボタンを自動生成する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Select`](../../app/components/shadcn/select.rb#L8) | `new(name: nil, default_value: nil, disabled: false, **args)` | 追加制約なし（signatureどおり） | なし |
| [`Shadcn::Select::Trigger`](../../app/components/shadcn/select.rb#L68) | `new(size: self.class.property_default(:size), **args)` | size: default, sm (default: "default") | `select-trigger` |
| [`Shadcn::Select::Value`](../../app/components/shadcn/select.rb#L114) | `new(placeholder: nil, **args)` | 追加制約なし（signatureどおり） | `select-value` |
| [`Shadcn::Select::Content`](../../app/components/shadcn/select.rb#L129) | `new(side: :bottom, align: :center, side_offset: 4, align_offset: 0, collision_padding: 5, **args)`<br>initializerはShadcn::FloatingPositionOptionsで定義 | side: top / right / bottom / left / inline-start / inline-end (default: :bottom)<br>align: start / center / end (default: :center)<br>side_offset: 有限の数値 (default: 4)<br>align_offset: 有限の数値 (default: 0)<br>collision_padding: 0以上の有限の数値 (default: 5) | `select-content` |
| [`Shadcn::Select::Group`](../../app/components/shadcn/select.rb#L172) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `select-group` |
| [`Shadcn::Select::Item`](../../app/components/shadcn/select.rb#L179) | `new(value:, disabled: false, **args)` | 追加制約なし（signatureどおり） | `select-item` |
| [`Shadcn::Select::Label`](../../app/components/shadcn/select.rb#L250) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `select-label` |
| [`Shadcn::Select::Separator`](../../app/components/shadcn/select.rb#L254) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `select-separator` |
| [`Shadcn::Select::ScrollUpButton`](../../app/components/shadcn/select.rb#L286) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `select-scroll-up-button` |
| [`Shadcn::Select::ScrollDownButton`](../../app/components/shadcn/select.rb#L321) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `select-scroll-down-button` |

## HTML attributesの適用先

- 既定: root属性は状態ホスト、各子クラスの属性は各子要素。name/default_value/disabledはroot直下のhidden inputへ反映される。
- Triggerはtype=buttonとrole=comboboxを持つ。
- Itemのvalueは必須で、disabledはARIAとdata属性へ反映される。

## フォーム送信

- 種別: `composite`
- nameがある場合、選択値一つをhidden inputのvalueとして送信する。未選択は空文字、nameなしは送信対象外、disabled=trueはhidden inputもdisabledとなり送信されない。複数値送信は非対応。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — default_valueは初期値だけを与え、接続後はhidden inputが確定値の唯一の状態源になる。外部controlled valueはない。
- Stimulus: `shadcn--select`
- browser API: Popover API / FormData / focus management
- keyboard: ArrowUp/ArrowDownで項目移動。 / Home/Endで先頭・末尾へ移動。 / Enter/Spaceで開く、または項目を確定する。 / Escapeで閉じ、Tabで通常のフォーカス移動を続ける。
- CIで確認する操作: `accessibility`、`form`、`keyboard`、`pointer`、`reconnect`、`state`

## upstreamとの差異・未対応機能

### 差異

- Base UIのReact Select状態ではなくhidden inputとStimulusで単一選択を管理する。

### 未対応

- multiple選択。
- ネイティブ制約検証。
- 外部controlled value/onValueChange。

## CIで描画する代表例を含むpreview定義

`shadcn/select/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/select_preview.rb](../../spec/dummy/app/components/previews/shadcn/select_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class SelectPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Select.new(default_value: "apple")) do
        safe_join([select_trigger, select_content])
      end
    end

    private

    def select_trigger
      render(Shadcn::Select::Trigger.new) do
        render(Shadcn::Select::Value.new(placeholder: "果物を選択"))
      end
    end

    def select_content
      render(Shadcn::Select::Content.new) do
        render(Shadcn::Select::Group.new) { select_items }
      end
    end

    def select_items
      safe_join(
        [
          render(Shadcn::Select::Label.new) { "果物" },
          render(Shadcn::Select::Item.new(value: "apple")) { "りんご" },
          render(Shadcn::Select::Item.new(value: "banana")) { "バナナ" },
          render(Shadcn::Select::Separator.new),
          render(Shadcn::Select::Item.new(value: "orange")) { "オレンジ" }
        ]
      )
    end
  end
end
```
