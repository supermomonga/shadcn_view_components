# `textarea` — `Shadcn::Textarea`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/textarea.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/textarea_preview.rb)

スタイル済みのネイティブtextarea。

## 構成

- 主コンポーネント: `Shadcn::Textarea`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

単一のtextarea要素で完結する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Textarea`](../../../app/components/shadcn/textarea.rb#L5) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `textarea` |

## HTML attributesの適用先

- 既定: Shadcn::Textareaが描画するtextarea要素。
- aria-label/aria-describedby/aria-invalid等のARIA属性は実textareaへそのまま渡る。

## フォーム送信

- 種別: `native`
- name/value/disabledはネイティブtextarea規則に従う。enabledかつnameありなら現在の文字列一つを送信し、空欄は空文字、disabledまたはnameなしは送信されない。複数の同名textareaは複数値を送信できる。

## 状態・JavaScript・キーボード

- 状態モデル: `native` — 現在値はtextarea.valueをブラウザが管理する。内容は初期値であり、コンポーネント独自のcontrolled/uncontrolled APIはない。
- Stimulus: 不要
- browser API: HTML textarea / FormData
- keyboard: 文字入力、選択、改行はブラウザ標準動作。
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- React wrapperではなくネイティブtextareaをRubyで直接描画する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/textarea/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/textarea_preview.rb](../../../spec/dummy/app/components/previews/shadcn/textarea_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class TextareaPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Textarea.new(placeholder: "自由入力"))
    end
  end
end
```
