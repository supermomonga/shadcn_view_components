# `attachment` — `Shadcn::Attachment`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/attachment.rb#L6) / [代表preview](../../spec/dummy/app/components/previews/shadcn/attachment_preview.rb)

添付ファイルの情報、状態、操作を並べる表示コンテナ。

## 構成

- 主コンポーネント: `Shadcn::Attachment`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: `Shadcn::Attachment::Group`、`Shadcn::Attachment::Media`、`Shadcn::Attachment::Content`、`Shadcn::Attachment::Title`、`Shadcn::Attachment::Description`、`Shadcn::Attachment::Actions`、`Shadcn::Attachment::Action`、`Shadcn::Attachment::Trigger`

Media、Content、Title、Description、Actions、Action、Triggerは表示内容に応じて組み合わせる。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Attachment`](../../app/components/shadcn/attachment.rb#L6) | `new(orientation: ShadcnViewComponents::Contracts::Attachment::DEFAULTS.fetch(:orientation),<br>                   size: ShadcnViewComponents::Contracts::Attachment::DEFAULTS.fetch(:size), **args)` | orientation: horizontal, vertical (default: horizontal)<br>size: default, sm, xs (default: default) | `attachment` |
| [`Shadcn::Attachment::Group`](../../app/components/shadcn/attachment.rb#L26) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `attachment-group` |
| [`Shadcn::Attachment::Media`](../../app/components/shadcn/attachment.rb#L30) | `new(variant: ShadcnViewComponents::Contracts::Attachment::Media::DEFAULTS.fetch(:variant), **args)` | variant: icon, image (default: icon) | `attachment-media` |
| [`Shadcn::Attachment::Content`](../../app/components/shadcn/attachment.rb#L44) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `attachment-content` |
| [`Shadcn::Attachment::Title`](../../app/components/shadcn/attachment.rb#L48) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `attachment-title` |
| [`Shadcn::Attachment::Description`](../../app/components/shadcn/attachment.rb#L52) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `attachment-description` |
| [`Shadcn::Attachment::Actions`](../../app/components/shadcn/attachment.rb#L56) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `attachment-actions` |
| [`Shadcn::Attachment::Action`](../../app/components/shadcn/attachment.rb#L60) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `attachment-action` |
| [`Shadcn::Attachment::Trigger`](../../app/components/shadcn/attachment.rb#L73) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `attachment-trigger` |

## HTML attributesの適用先

- 既定: Shadcn::Attachment
- mediaのvariantはMediaへ、ボタン属性はActionまたはTriggerへ渡す。

## フォーム送信

- 種別: `none`
- ファイルinputを内包せずフォーム値を送信しない。ActionとTriggerは既定でtype=button。

## 状態・JavaScript・キーボード

- 状態モデル: `server` — orientation、size、data-stateは描画引数または利用者属性で与え、内部controlled状態は持たない。
- Stimulus: 不要
- browser API: 追加要件なし
- keyboard: ActionとTriggerは通常のbuttonとして操作する。
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- upload処理やReact contextを持たない表示用ViewComponentとして提供する。

### 未対応

- 組み込みのファイル選択とアップロード処理。

## CIで描画する代表例を含むpreview定義

`shadcn/attachment/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/attachment_preview.rb](../../spec/dummy/app/components/previews/shadcn/attachment_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class AttachmentPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Attachment.new) do
        safe_join([
                    render(Shadcn::Attachment::Media.new(variant: :icon)) { "📄" },
                    render(Shadcn::Attachment::Content.new) do
                      safe_join([
                                  render(Shadcn::Attachment::Title.new) { "report.pdf" },
                                  render(Shadcn::Attachment::Description.new) { "PDF・2.4 MB" }
                                ])
                    end,
                    render(Shadcn::Attachment::Actions.new) do
                      render(Shadcn::Attachment::Action.new(aria: { label: "report.pdfを削除" })) { "削除" }
                    end
                  ])
      end
    end
  end
end
```
