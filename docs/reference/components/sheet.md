# `sheet` — `Shadcn::Sheet`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/sheet.rb#L7) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/sheet_preview.rb)

画面端から表示するモーダルパネルをネイティブdialogで提供する。

## 構成

- 主コンポーネント: `Shadcn::Sheet`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Sheet::Trigger`、`Shadcn::Sheet::Content`、`Shadcn::Sheet::Title`
- このitemが公開する任意の補助クラス: `Shadcn::Sheet::Close`、`Shadcn::Sheet::Header`、`Shadcn::Sheet::Footer`、`Shadcn::Sheet::Description`

TitleはContentのアクセス可能な名前として使う。Titleを置かない場合はContentへaria-labelを必ず指定する。Close、Header、Footer、Descriptionは任意で、Contentは既定で閉じるボタンを生成する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Sheet`](../../../app/components/shadcn/sheet.rb#L7) | `new(**args)` | 追加制約なし（signatureどおり） | `sheet` |
| [`Shadcn::Sheet::Trigger`](../../../app/components/shadcn/sheet.rb#L21) | `new(variant: nil, size: nil, **args)`<br>initializerはShadcn::ButtonStyledで定義 | button size: default, icon, icon-lg, icon-sm, icon-xs, lg, sm, xs (未指定時は装飾を追加しない)<br>button variant: default, destructive, ghost, link, outline, secondary (未指定時は装飾を追加しない) | `sheet-trigger` |
| [`Shadcn::Sheet::Close`](../../../app/components/shadcn/sheet.rb#L39) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sheet-close` |
| [`Shadcn::Sheet::Content`](../../../app/components/shadcn/sheet.rb#L54) | `new(side: self.class.property_default(:side), show_close_button: true, **args)` | side: top, right, bottom, left (default: "right") | `sheet-content`<br>`sheet-close` |
| [`Shadcn::Sheet::Header`](../../../app/components/shadcn/sheet.rb#L135) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sheet-header` |
| [`Shadcn::Sheet::Footer`](../../../app/components/shadcn/sheet.rb#L139) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sheet-footer` |
| [`Shadcn::Sheet::Title`](../../../app/components/shadcn/sheet.rb#L143) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sheet-title` |
| [`Shadcn::Sheet::Description`](../../../app/components/shadcn/sheet.rb#L150) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sheet-description` |

## HTML attributesの適用先

- 既定: root属性はcontroller host、子クラスの属性は各子要素。Content属性はdialogへ渡る。
- TriggerとCloseはtype=button。
- Contentのsideはdata-sideへ反映され、aria-modal=trueを既定設定する。
- TitleがあればStimulusがContentのaria-labelledbyへTitleのidを接続する。

## フォーム送信

- 種別: `none`
- TriggerとCloseは既定でtype=buttonのためフォームを送信しない。name/value/disabledや独自の送信値は管理しない。dialog内のフォームは通常どおり各コントロールを送信できる。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — dialog.openが開閉の実状態で、Stimulusがdata属性とtriggerのARIAを同期する。外部controlled openはない。
- Stimulus: `shadcn--dialog`
- browser API: HTMLDialogElement.showModal / HTMLDialogElement.close / close event
- keyboard: Escapeでモーダルdialogを閉じる。 / Trigger/Closeのbutton標準操作を使う。
- CIで確認する操作: `accessibility`、`keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- React Dialog primitiveとPortalではなくネイティブdialogとStimulusを使う。

### 未対応

- 外部controlled open/onOpenChange。
- Portal先の指定。

## CIで描画する代表例を含むpreview定義

`shadcn/sheet/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/sheet_preview.rb](../../../spec/dummy/app/components/previews/shadcn/sheet_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class SheetPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Sheet.new) do
        safe_join([
          render(Shadcn::Sheet::Trigger.new(variant: :outline)) { "メニューを開く" },
          render(Shadcn::Sheet::Content.new) do
            safe_join([
              render(Shadcn::Sheet::Header.new) do
                safe_join([
                  render(Shadcn::Sheet::Title.new) { "設定" },
                  render(Shadcn::Sheet::Description.new) { "右からスライドインします" }
                ])
              end,
              render(Shadcn::Sheet::Footer.new) do
                render(Shadcn::Sheet::Close.new) { "閉じる" }
              end
            ])
          end
        ])
      end
    end
  end
end
```
