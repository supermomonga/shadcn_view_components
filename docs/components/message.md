# `message` — `Shadcn::Message::Group`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/message.rb#L9) / [代表preview](../../spec/dummy/app/components/previews/shadcn/message_preview.rb)

チャットの送信者、アバター、本文、補助情報を整列する静的メッセージ行。

## 構成

- 主コンポーネント: `Shadcn::Message::Group`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Message::Content`
- このitemが公開する任意の補助クラス: `Shadcn::Message`、`Shadcn::Message::Avatar`、`Shadcn::Message::Footer`、`Shadcn::Message::Header`

複数行はMessage::Groupで囲み、各MessageへContentを置く。Avatar、Header、Footerは必要な情報がある場合に加える。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Message::Group`](../../app/components/shadcn/message.rb#L9) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `message-group` |
| [`Shadcn::Message`](../../app/components/shadcn/message.rb#L6) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `message` |
| [`Shadcn::Message::Avatar`](../../app/components/shadcn/message.rb#L13) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `message-avatar` |
| [`Shadcn::Message::Content`](../../app/components/shadcn/message.rb#L17) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `message-content` |
| [`Shadcn::Message::Footer`](../../app/components/shadcn/message.rb#L21) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `message-footer` |
| [`Shadcn::Message::Header`](../../app/components/shadcn/message.rb#L25) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `message-header` |

## HTML attributesの適用先

- 既定: 各公開クラスが描く自身のdata-slot要素。
- 例外なし。

## フォーム送信

- 種別: `none`
- 表示専用でname/value/disabledや送信値を持たない。Content内の操作部品は各自の契約に従う。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — 内容と並びはSSR時に固定され、controlled/uncontrolled状態はない。
- Stimulus: 不要
- browser API: 追加要件なし
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- Reactのメッセージ構造を、Group/Message/Content等のサーバー描画ViewComponentとして提供する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/message/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/message_preview.rb](../../spec/dummy/app/components/previews/shadcn/message_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class MessagePreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Message::Group.new(aria: { label: "会話" })) do
        render(Shadcn::Message.new) do
          safe_join([
                      render(Shadcn::Message::Avatar.new(aria: { hidden: "true" })) { "🤖" },
                      render(Shadcn::Message::Content.new) do
                        safe_join([
                                    render(Shadcn::Message::Header.new) { "アシスタント" },
                                    content_tag(:p, "ご用件をお聞かせください。"),
                                    render(Shadcn::Message::Footer.new) { "たった今" }
                                  ])
                      end
                    ])
        end
      end
    end
  end
end
```
