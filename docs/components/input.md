# `input` — `Shadcn::Input`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/input.rb#L5) / [代表preview](../../spec/dummy/app/components/previews/shadcn/input_preview.rb)

任意のネイティブinput属性をそのまま所有する、装飾済みinput要素。

## 構成

- 主コンポーネント: `Shadcn::Input`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

void要素のため子コンポーネントを持たない。LabelやFieldと組み合わせる場合はid/forとARIA参照を利用者が接続する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Input`](../../app/components/shadcn/input.rb#L5) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `input` |

## HTML attributesの適用先

- 既定: 実際のinput要素。
- type、name、value、disabled、required、multiple、data、ARIA、イベント属性を特別なラッパーなしでinputへ渡す。

## フォーム送信

- 種別: `native`
- name付きでdisabledでないinputが、typeに応じたvalueをネイティブ送信する。空文字の成功コントロールは通常name=として送信され、disabledは省略される。未選択・複数値の扱いはcheckbox/radio/file等の指定typeとmultiple属性のHTML標準に従う。

## 状態・JavaScript・キーボード

- 状態モデル: `native` — value/defaultValue相当を含む実行時状態はHTMLInputElementが所有し、本コンポーネントはcontrolled更新を実装しない。
- Stimulus: 不要
- browser API: HTMLInputElement / Native constraint validation and form submission
- keyboard: 編集、選択、増減、ファイル選択等は指定したinput typeのネイティブ操作に従う。
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- React InputPrimitiveではなく、属性を直接所有する単一のネイティブinputをSSRする。

### 未対応

- render prop/asChildによる別要素への置換。

## CIで描画する代表例を含むpreview定義

`shadcn/input/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/input_preview.rb](../../spec/dummy/app/components/previews/shadcn/input_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class InputPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Input.new(type: :email, placeholder: "email@example.com"))
    end

    def disabled
      render(Shadcn::Input.new(placeholder: "無効", disabled: true))
    end
  end
end
```
