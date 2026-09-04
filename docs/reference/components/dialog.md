# `dialog` — `Shadcn::Dialog`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/dialog.rb#L9) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/dialog_preview.rb)

ネイティブdialog要素によるモーダルダイアログ。

## 構成

- 主コンポーネント: `Shadcn::Dialog`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Dialog::Trigger`、`Shadcn::Dialog::Content`、`Shadcn::Dialog::Title`、`Shadcn::Dialog::Description`
- このitemが公開する任意の補助クラス: `Shadcn::Dialog::Portal`、`Shadcn::Dialog::Close`、`Shadcn::Dialog::Overlay`、`Shadcn::Dialog::Header`、`Shadcn::Dialog::Footer`

Close、Header、Footerは任意。TriggerとContentは同じroot内に置く。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Dialog`](../../../app/components/shadcn/dialog.rb#L9) | `new(**args)` | 追加制約なし（signatureどおり） | `dialog` |
| [`Shadcn::Dialog::Trigger`](../../../app/components/shadcn/dialog.rb#L25) | `new(variant: nil, size: nil, **args)`<br>initializerはShadcn::ButtonStyledで定義 | button size: default, icon, icon-lg, icon-sm, icon-xs, lg, sm, xs (未指定時は装飾を追加しない)<br>button variant: default, destructive, ghost, link, outline, secondary (未指定時は装飾を追加しない) | `dialog-trigger` |
| [`Shadcn::Dialog::Portal`](../../../app/components/shadcn/dialog.rb#L43) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dialog-portal` |
| [`Shadcn::Dialog::Close`](../../../app/components/shadcn/dialog.rb#L48) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dialog-close` |
| [`Shadcn::Dialog::Overlay`](../../../app/components/shadcn/dialog.rb#L63) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dialog-overlay` |
| [`Shadcn::Dialog::Content`](../../../app/components/shadcn/dialog.rb#L69) | `new(show_close_button: true, **args)` | 追加制約なし（signatureどおり） | `dialog-content`<br>`dialog-close` |
| [`Shadcn::Dialog::Header`](../../../app/components/shadcn/dialog.rb#L156) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dialog-header` |
| [`Shadcn::Dialog::Footer`](../../../app/components/shadcn/dialog.rb#L160) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dialog-footer` |
| [`Shadcn::Dialog::Title`](../../../app/components/shadcn/dialog.rb#L164) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dialog-title` |
| [`Shadcn::Dialog::Description`](../../../app/components/shadcn/dialog.rb#L172) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dialog-description` |

## HTML attributesの適用先

- 既定: Shadcn::Dialog
- dialog要素のARIA属性はContentへ、ボタン属性はTriggerまたはCloseへ渡す。

## フォーム送信

- 種別: `none`
- TriggerとCloseは既定でtype=buttonであり、コンポーネント自身はフォーム値を送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — open状態はdialog要素とStimulusが保持する。show_close_buttonはSSR構造だけを決め、controlled open APIはない。
- Stimulus: `shadcn--dialog`
- browser API: HTMLDialogElement.showModal / HTMLDialogElement.close
- keyboard: Tabでモーダル内を移動する。 / Escapeで閉じる。 / TriggerとCloseはEnterまたはSpaceで操作する。
- CIで確認する操作: `accessibility`、`form`、`keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- Base UI Dialog primitiveの代わりにdialogを使い、RootとPortalは実体ラッパー、Overlayは::backdropで代替する。

### 未対応

- controlled openとonOpenChange、Portal先の指定。

## CIで描画する代表例を含むpreview定義

`shadcn/dialog/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/dialog_preview.rb](../../../spec/dummy/app/components/previews/shadcn/dialog_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class DialogPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Dialog.new) do
        safe_join([
          render(Shadcn::Dialog::Trigger.new(variant: :outline)) { "設定を開く" },
          render(Shadcn::Dialog::Content.new) do
            safe_join([
              render(Shadcn::Dialog::Header.new) do
                safe_join([
                  render(Shadcn::Dialog::Title.new) { "プロフィール編集" },
                  render(Shadcn::Dialog::Description.new) { "公開される情報です" }
                ])
              end,
              render(Shadcn::Dialog::Footer.new) do
                render(Shadcn::Dialog::Close.new) { "閉じる" }
              end
            ])
          end
        ])
      end
    end
  end
end
```
