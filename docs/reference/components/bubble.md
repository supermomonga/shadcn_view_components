# `bubble` — `Shadcn::Bubble::Group`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/bubble.rb#L18) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/bubble_preview.rb)

会話の発言本文と反応を吹き出しとして表示する。

## 構成

- 主コンポーネント: `Shadcn::Bubble::Group`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Bubble::Content`
- このitemが公開する任意の補助クラス: `Shadcn::Bubble`、`Shadcn::Bubble::Reactions`

複数件はGroupでまとめ、Reactionsは任意に追加する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Bubble::Group`](../../../app/components/shadcn/bubble.rb#L18) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `bubble-group` |
| [`Shadcn::Bubble`](../../../app/components/shadcn/bubble.rb#L6) | `new(variant: ShadcnViewComponents::Contracts::Bubble::DEFAULTS.fetch(:variant), **args)` | variant: default, destructive, ghost, muted, outline, secondary, tinted (default: default) | `bubble` |
| [`Shadcn::Bubble::Content`](../../../app/components/shadcn/bubble.rb#L22) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `bubble-content` |
| [`Shadcn::Bubble::Reactions`](../../../app/components/shadcn/bubble.rb#L26) | `new(align: ShadcnViewComponents::Contracts::Bubble::Reactions::DEFAULTS.fetch(:align),<br>                     side: ShadcnViewComponents::Contracts::Bubble::Reactions::DEFAULTS.fetch(:side), **args)` | align: end, start (default: end)<br>side: bottom, top (default: bottom) | `bubble-reactions` |

## HTML attributesの適用先

- 既定: Shadcn::Bubble
- reaction配置のalignはReactionsへ渡す。

## フォーム送信

- 種別: `none`
- フォーム値は送信せず、反応操作の送信処理も内蔵しない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — variantとalignはサーバ描画時に確定する。
- Stimulus: 不要
- browser API: 追加要件なし
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- 反応のイベント処理を持たない表示用ViewComponentとして提供する。

### 未対応

- 組み込みのreaction追加処理。

## CIで描画する代表例を含むpreview定義

`shadcn/bubble/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/bubble_preview.rb](../../../spec/dummy/app/components/previews/shadcn/bubble_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class BubblePreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Bubble::Group.new) do
        render(Shadcn::Bubble.new) do
          safe_join([
                      render(Shadcn::Bubble::Content.new) { "ご質問ありがとうございます。" },
                      render(Shadcn::Bubble::Reactions.new(aria: { label: "リアクション" })) { "👍 2" }
                    ])
        end
      end
    end
  end
end
```
