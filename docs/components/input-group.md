# `input-group` — `Shadcn::InputGroup`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/input_group.rb#L6) / [代表preview](../../spec/dummy/app/components/previews/shadcn/input_group_preview.rb)

inputまたはtextareaと、前後のAddon、Button、Textを一体表示する入力コンテナ。

## 構成

- 主コンポーネント: `Shadcn::InputGroup`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: `Shadcn::InputGroup::Addon`、`Shadcn::InputGroup::Button`、`Shadcn::InputGroup::Input`、`Shadcn::InputGroup::Textarea`、`Shadcn::InputGroup::Text`

InputまたはTextareaのどちらか一つを必ず置く。Addon、Button、Textは任意で、同じInputGroup内へ配置する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::InputGroup`](../../app/components/shadcn/input_group.rb#L6) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `input-group` |
| [`Shadcn::InputGroup::Addon`](../../app/components/shadcn/input_group.rb#L9) | `new(align: ShadcnViewComponents::Contracts::InputGroup::Addon::DEFAULTS.fetch(:align), **args)` | align: block-end, block-start, inline-end, inline-start (default: inline-start) | `input-group-addon` |
| [`Shadcn::InputGroup::Button`](../../app/components/shadcn/input_group/button.rb#L9) | `new(variant: :ghost, size: "xs", **args)` | size: icon-sm, icon-xs, sm, xs (default: xs)<br>variant: default, destructive, ghost, link, outline, secondary (default: :ghost) | なし |
| [`Shadcn::InputGroup::Input`](../../app/components/shadcn/input_group.rb#L27) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `input-group-control` |
| [`Shadcn::InputGroup::Textarea`](../../app/components/shadcn/input_group.rb#L37) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `input-group-control` |
| [`Shadcn::InputGroup::Text`](../../app/components/shadcn/input_group.rb#L47) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | なし |

## HTML attributesの適用先

- 既定: 各公開クラスが描く自身のdata-slot要素。
- InputGroup::Inputの属性は内側のShadcn::Inputへ、Textareaの属性は内側のShadcn::Textareaへ渡る。
- InputGroup::Buttonは実buttonを描き、type未指定時はtype=button、sizeはdata-sizeにも反映される。
- Addonのalign:はdata-alignと契約クラスへ反映される。
- Input/ Textareaへ渡したARIA属性は内側の実input/textareaへ転送される。

## フォーム送信

- 種別: `container`
- InputGroup自体、Addon、Text、Buttonは値を送信しない。Input/ Textareaの実要素がname/value/disabledを所有し、空文字はname=、disabledは省略される。単一テキスト値が基本で、複数値の合成は行わない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — コンテナに状態はなく、入力中のuncontrolled値は内側の実input/textareaが所有する。Ruby側からのcontrolled同期はない。
- Stimulus: 不要
- browser API: HTMLInputElement or HTMLTextAreaElement through the control child
- keyboard: 入力編集は実input/textareaへ委ねる。 / Enter/SpaceでInputGroup::Buttonを作動させる。
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- Reactのコンポーネント合成を、専用Input/Textarea/Button ViewComponentが実ネイティブ要素へ委譲する形で提供する。

### 未対応

- render prop/asChildによる任意コントロールへの属性合成。

## CIで描画する代表例を含むpreview定義

`shadcn/input_group/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/input_group_preview.rb](../../spec/dummy/app/components/previews/shadcn/input_group_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class InputGroupPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::InputGroup.new(class: "max-w-xs")) do
        safe_join([
                    render(Shadcn::InputGroup::Addon.new) { "https://" },
                    render(Shadcn::InputGroup::Input.new(type: "text", placeholder: "example.com", aria: { label: "Webサイト" }))
                  ])
      end
    end
  end
end
```
