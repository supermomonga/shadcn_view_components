# `alert-dialog` — `Shadcn::AlertDialog`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/alert_dialog.rb#L9) / [代表preview](../../spec/dummy/app/components/previews/shadcn/alert_dialog_preview.rb)

重要な判断を要求するネイティブモーダルダイアログ。

## 構成

- 主コンポーネント: `Shadcn::AlertDialog`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::AlertDialog::Trigger`、`Shadcn::AlertDialog::Content`、`Shadcn::AlertDialog::Title`、`Shadcn::AlertDialog::Description`、`Shadcn::AlertDialog::Action`、`Shadcn::AlertDialog::Cancel`
- このitemが公開する任意の補助クラス: `Shadcn::AlertDialog::Portal`、`Shadcn::AlertDialog::Overlay`、`Shadcn::AlertDialog::Header`、`Shadcn::AlertDialog::Footer`、`Shadcn::AlertDialog::Media`

TriggerとContentを同じroot内に置き、ActionとCancelをContent内に置く。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::AlertDialog`](../../app/components/shadcn/alert_dialog.rb#L9) | `new(**args)` | 追加制約なし（signatureどおり） | `alert-dialog` |
| [`Shadcn::AlertDialog::Trigger`](../../app/components/shadcn/alert_dialog.rb#L23) | `new(variant: nil, size: nil, **args)`<br>initializerはShadcn::ButtonStyledで定義 | button size: default, icon, icon-lg, icon-sm, icon-xs, lg, sm, xs (未指定時は装飾を追加しない)<br>button variant: default, destructive, ghost, link, outline, secondary (未指定時は装飾を追加しない) | `alert-dialog-trigger` |
| [`Shadcn::AlertDialog::Portal`](../../app/components/shadcn/alert_dialog.rb#L41) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `alert-dialog-portal` |
| [`Shadcn::AlertDialog::Overlay`](../../app/components/shadcn/alert_dialog.rb#L46) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `alert-dialog-overlay` |
| [`Shadcn::AlertDialog::Content`](../../app/components/shadcn/alert_dialog.rb#L50) | `new(size: self.class.property_default(:size), **args)` | size: default, sm (default: "default") | `alert-dialog-content` |
| [`Shadcn::AlertDialog::Header`](../../app/components/shadcn/alert_dialog.rb#L80) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `alert-dialog-header` |
| [`Shadcn::AlertDialog::Footer`](../../app/components/shadcn/alert_dialog.rb#L84) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `alert-dialog-footer` |
| [`Shadcn::AlertDialog::Title`](../../app/components/shadcn/alert_dialog.rb#L88) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `alert-dialog-title` |
| [`Shadcn::AlertDialog::Description`](../../app/components/shadcn/alert_dialog.rb#L95) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `alert-dialog-description` |
| [`Shadcn::AlertDialog::Media`](../../app/components/shadcn/alert_dialog.rb#L102) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `alert-dialog-media` |
| [`Shadcn::AlertDialog::Action`](../../app/components/shadcn/alert_dialog.rb#L108) | `new(variant: :default, size: :default, **args)` | variant: default, destructive, ghost, link, outline, secondary (default: :default)<br>size: default, icon, icon-lg, icon-sm, icon-xs, lg, sm, xs (default: :default) | `alert-dialog-action` |
| [`Shadcn::AlertDialog::Cancel`](../../app/components/shadcn/alert_dialog.rb#L145) | `new(variant: :outline, size: :default, **args)` | variant: default, destructive, ghost, link, outline, secondary (default: :outline)<br>size: default, icon, icon-lg, icon-sm, icon-xs, lg, sm, xs (default: :default) | `alert-dialog-cancel` |

## HTML attributesの適用先

- 既定: Shadcn::AlertDialog
- sizeとdialog要素のARIA属性はContentへ、ボタン属性はTrigger・Action・Cancelへ渡す。

## フォーム送信

- 種別: `none`
- Action、Cancel、Triggerは既定でtype=buttonであり、コンポーネント自身はフォーム値を送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — open状態はdialog要素とStimulusが保持し、外部controlled値APIはない。
- Stimulus: `shadcn--dialog`
- browser API: HTMLDialogElement.showModal / HTMLDialogElement.close
- keyboard: Tabでモーダル内を移動する。 / Escapeで閉じる。
- CIで確認する操作: `accessibility`、`keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- Base UI primitiveの代わりにdialogを使い、Portalはラッパー、Overlayは::backdropで代替する。

### 未対応

- controlled openとonOpenChange。

## CIで描画する代表例を含むpreview定義

`shadcn/alert_dialog/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/alert_dialog_preview.rb](../../spec/dummy/app/components/previews/shadcn/alert_dialog_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class AlertDialogPreview < Shadcn::PreviewBase
    def default
      render_alert_dialog(
        trigger: { text: "アカウント削除", variant: :destructive },
        title: "本当に削除しますか?",
        description: "この操作は取り消せません。データが完全に削除されます。",
        action: { text: "削除する", variant: :destructive }
      )
    end

    def accessibility
      render_alert_dialog(
        trigger: { text: "変更を確認", variant: :outline },
        title: "変更を保存しますか?",
        description: "保存すると変更内容が反映されます。",
        action: { text: "保存する", variant: :default }
      )
    end

    private

    def render_alert_dialog(trigger:, title:, description:, action:)
      render(Shadcn::AlertDialog.new) do
        safe_join([
                    alert_dialog_trigger(**trigger),
                    alert_dialog_content(title:, description:, action:)
                  ])
      end
    end

    def alert_dialog_trigger(text:, variant:)
      render(Shadcn::AlertDialog::Trigger.new(variant:)) { text }
    end

    def alert_dialog_content(title:, description:, action:)
      render(Shadcn::AlertDialog::Content.new) do
        safe_join([
                    alert_dialog_header(title, description),
                    alert_dialog_footer(**action)
                  ])
      end
    end

    def alert_dialog_header(title, description)
      render(Shadcn::AlertDialog::Header.new) do
        safe_join([
                    render(Shadcn::AlertDialog::Title.new) { title },
                    render(Shadcn::AlertDialog::Description.new) { description }
                  ])
      end
    end

    def alert_dialog_footer(text:, variant:)
      render(Shadcn::AlertDialog::Footer.new) do
        safe_join([
                    render(Shadcn::AlertDialog::Cancel.new) { "キャンセル" },
                    render(Shadcn::AlertDialog::Action.new(variant:)) { text }
                  ])
      end
    end
  end
end
```
