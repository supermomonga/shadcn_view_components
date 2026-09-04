# `message-scroller` — `Shadcn::MessageScroller`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/message_scroller.rb#L8) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/message_scroller_preview.rb)

メッセージ履歴をスクロールし、末尾から離れたときに「一番下へ」操作を表示する領域。

## 構成

- 主コンポーネント: `Shadcn::MessageScroller`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::MessageScroller::Provider`、`Shadcn::MessageScroller::Viewport`、`Shadcn::MessageScroller::Content`、`Shadcn::MessageScroller::Button`
- このitemが公開する任意の補助クラス: `Shadcn::MessageScroller::Item`

Provider内へスクロール対象のViewport/ContentとButtonを兄弟として置く。各メッセージは任意のItemで包む。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::MessageScroller`](../../../app/components/shadcn/message_scroller.rb#L8) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `message-scroller` |
| [`Shadcn::MessageScroller::Provider`](../../../app/components/shadcn/message_scroller.rb#L16) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | なし |
| [`Shadcn::MessageScroller::Viewport`](../../../app/components/shadcn/message_scroller.rb#L20) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `message-scroller-viewport` |
| [`Shadcn::MessageScroller::Content`](../../../app/components/shadcn/message_scroller.rb#L28) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `message-scroller-content` |
| [`Shadcn::MessageScroller::Item`](../../../app/components/shadcn/message_scroller.rb#L32) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `message-scroller-item` |
| [`Shadcn::MessageScroller::Button`](../../../app/components/shadcn/message_scroller.rb#L36) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `message-scroller-button` |

## HTML attributesの適用先

- 既定: 各公開クラスが描く自身のdata-slot要素。
- Viewportにはキーボードスクロールのためtabindex=0が加わる。
- Buttonはtype未指定時にtype=buttonとなり、末尾へスクロールするStimulus actionが加わる。
- Buttonのaria-label等のアクセシブル名は利用者が属性として指定する。

## フォーム送信

- 種別: `none`
- Buttonはtype=buttonでname/valueを送信せず、MessageScrollerも成功コントロールを生成しない。disabled、未選択、複数値の送信契約はない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — ViewportのscrollTopが実行時状態の正本で、末尾との差が24px以上ならStimulusがButtonを表示する。Ruby側のcontrolled scroll位置はない。
- Stimulus: `shadcn--message-scroller`
- browser API: Element scroll event / Element.scrollTo()
- keyboard: Viewportへフォーカス後、Home/End/PageUp/PageDown等のネイティブスクロールキーを利用できる。 / Enter/SpaceでButtonを作動させ末尾へ戻る。
- CIで確認する操作: `keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- Reactのスクロール追従部品ではなく、既存DOMのscrollTopとButton表示をStimulusで同期する。

### 未対応

- 新規メッセージ追加のMutationObserver監視や、自動的な末尾追従。
- スクロール挙動や末尾判定しきい値の公開設定。

## CIで描画する代表例を含むpreview定義

`shadcn/message_scroller/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/message_scroller_preview.rb](../../../spec/dummy/app/components/previews/shadcn/message_scroller_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class MessageScrollerPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::MessageScroller.new) do
        render(Shadcn::MessageScroller::Provider.new) do
          safe_join([
                      render(Shadcn::MessageScroller::Viewport.new(aria: { label: "メッセージ履歴" })) do
                        render(Shadcn::MessageScroller::Content.new) do
                          render(Shadcn::MessageScroller::Item.new) { "最新のメッセージ" }
                        end
                      end,
                      render(Shadcn::MessageScroller::Button.new(aria: { label: "一番下へ移動" })) { "一番下へ" }
                    ])
        end
      end
    end
  end
end
```
