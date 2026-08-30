# `collapsible` — `Shadcn::Collapsible`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/collapsible.rb#L5) / [代表preview](../../spec/dummy/app/components/previews/shadcn/collapsible_preview.rb)

ネイティブdetailsで任意内容を開閉する。

## 構成

- 主コンポーネント: `Shadcn::Collapsible`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Collapsible::Trigger`、`Shadcn::Collapsible::Content`
- このitemが公開する任意の補助クラス: なし

Triggerをrootの直接子としてContentより前に置く。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Collapsible`](../../app/components/shadcn/collapsible.rb#L5) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `collapsible` |
| [`Shadcn::Collapsible::Trigger`](../../app/components/shadcn/collapsible.rb#L13) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `collapsible-trigger` |
| [`Shadcn::Collapsible::Content`](../../app/components/shadcn/collapsible.rb#L21) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `collapsible-content` |

## HTML attributesの適用先

- 既定: Shadcn::Collapsible
- trigger固有の属性はTriggerへ、初期開状態はrootのopen属性で指定する。
- details/summaryのネイティブアクセシビリティを使い、独自ARIA状態は追加しない。

## フォーム送信

- 種別: `none`
- フォーム値は送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `native` — open状態はdetailsが保持するuncontrolled状態で、JavaScriptを必要としない。
- Stimulus: 不要
- browser API: HTML details element
- keyboard: TriggerのEnterまたはSpaceで開閉する。
- CIで確認する操作: `keyboard`、`no_js`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- Base UI Collapsible primitiveの代わりにdetailsとsummaryを使う。

### 未対応

- controlled openとonOpenChange。

## CIで描画する代表例を含むpreview定義

`shadcn/collapsible/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/collapsible_preview.rb](../../spec/dummy/app/components/previews/shadcn/collapsible_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class CollapsiblePreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Collapsible.new) do
        safe_join([
          render(Shadcn::Collapsible::Trigger.new) { "開く/閉じる" },
          render(Shadcn::Collapsible::Content.new) { "折りたたまれる内容" }
        ])
      end
    end
  end
end
```
