# `accordion` — `Shadcn::Accordion`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/accordion.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/accordion_preview.rb)

ネイティブdetailsで開閉するアコーディオン。

## 構成

- 主コンポーネント: `Shadcn::Accordion`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Accordion::Item`、`Shadcn::Accordion::Trigger`、`Shadcn::Accordion::Content`
- このitemが公開する任意の補助クラス: なし

TriggerはItemの直接子に置き、同時に一つだけ開く場合は各Itemへ同じnameを渡す。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Accordion`](../../../app/components/shadcn/accordion.rb#L5) | `new(**args)` | 追加制約なし（signatureどおり） | `accordion` |
| [`Shadcn::Accordion::Item`](../../../app/components/shadcn/accordion.rb#L24) | `new(**args)` | 追加制約なし（signatureどおり） | `accordion-item` |
| [`Shadcn::Accordion::Trigger`](../../../app/components/shadcn/accordion.rb#L45) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `accordion-trigger`<br>`accordion-trigger-icon` |
| [`Shadcn::Accordion::Content`](../../../app/components/shadcn/accordion.rb#L101) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `accordion-content` |

## HTML attributesの適用先

- 既定: Shadcn::Accordion
- nameとopenはShadcn::Accordion::Itemへ渡す。
- Triggerのaria-expandedはStimulusがdetails.openと同期し、装飾iconはaria-hiddenになる。

## フォーム送信

- 種別: `none`
- フォーム値は送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `native` — open状態はdetailsが保持するuncontrolled状態で、Stimulusはdata-stateとアニメーション寸法だけを同期する。
- Stimulus: `shadcn--accordion`
- browser API: HTML details element
- keyboard: TriggerのEnterまたはSpaceで開閉する。
- CIで確認する操作: `keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- React primitiveの代わりにdetailsとsummaryを使い、upstreamのHeaderラッパーを省略する。

### 未対応

- 外部から制御するvalueとonValueChange。

## CIで描画する代表例を含むpreview定義

`shadcn/accordion/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/accordion_preview.rb](../../../spec/dummy/app/components/previews/shadcn/accordion_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class AccordionPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Accordion.new) do
        safe_join([
          accordion_item("1", "最初の項目", "内容その1"),
          accordion_item("2", "2番目の項目", "内容その2")
        ])
      end
    end

    private

    def accordion_item(name, title, body)
      render(Shadcn::Accordion::Item.new(name: "accordion")) do
        safe_join([
          render(Shadcn::Accordion::Trigger.new) { title },
          render(Shadcn::Accordion::Content.new) { body }
        ])
      end
    end
  end
end
```
