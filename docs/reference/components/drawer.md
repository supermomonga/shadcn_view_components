# `drawer` — `Shadcn::Drawer`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/drawer.rb#L10) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/drawer_preview.rb)

ネイティブdialogを使い、画面下部から表示するモーダルドロワー。

## 構成

- 主コンポーネント: `Shadcn::Drawer`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Drawer::Trigger`、`Shadcn::Drawer::Content`、`Shadcn::Drawer::Title`
- このitemが公開する任意の補助クラス: `Shadcn::Drawer::Close`、`Shadcn::Drawer::Portal`、`Shadcn::Drawer::Overlay`、`Shadcn::Drawer::Header`、`Shadcn::Drawer::Footer`、`Shadcn::Drawer::Description`

TriggerとContentを同じShadcn::Drawer内へ置く。Titleはダイアログ名を与え、Description、Header、Footer、Closeは内容に応じて加える。PortalとOverlayは公開されるがContentへ自動挿入されない。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Drawer`](../../../app/components/shadcn/drawer.rb#L10) | `new(**args)` | 追加制約なし（signatureどおり） | `drawer` |
| [`Shadcn::Drawer::Trigger`](../../../app/components/shadcn/drawer.rb#L25) | `new(variant: nil, size: nil, **args)`<br>initializerはShadcn::ButtonStyledで定義 | button size: default, icon, icon-lg, icon-sm, icon-xs, lg, sm, xs (未指定時は装飾を追加しない)<br>button variant: default, destructive, ghost, link, outline, secondary (未指定時は装飾を追加しない) | `drawer-trigger` |
| [`Shadcn::Drawer::Close`](../../../app/components/shadcn/drawer.rb#L43) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `drawer-close` |
| [`Shadcn::Drawer::Portal`](../../../app/components/shadcn/drawer.rb#L58) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `drawer-portal` |
| [`Shadcn::Drawer::Overlay`](../../../app/components/shadcn/drawer.rb#L63) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `drawer-overlay` |
| [`Shadcn::Drawer::Content`](../../../app/components/shadcn/drawer.rb#L68) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `drawer-portal`<br>`drawer-viewport`<br>`drawer-popup`<br>`drawer-content` |
| [`Shadcn::Drawer::Header`](../../../app/components/shadcn/drawer.rb#L128) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `drawer-header` |
| [`Shadcn::Drawer::Footer`](../../../app/components/shadcn/drawer.rb#L132) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `drawer-footer` |
| [`Shadcn::Drawer::Title`](../../../app/components/shadcn/drawer.rb#L136) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `drawer-title` |
| [`Shadcn::Drawer::Description`](../../../app/components/shadcn/drawer.rb#L143) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `drawer-description` |

## HTML attributesの適用先

- 既定: 各クラスが描く自身のdata-slot要素。
- Drawer::Contentのclass:はdrawer-popupへ、その他の利用者HTML属性は内側のdialogへ渡る。
- Drawer::Contentはdrawer-portal、dialog、drawer-viewport、drawer-popup、drawer-contentを内部生成する。
- Drawer::TriggerとDrawer::Closeはtype未指定時にtype=buttonとなる。
- Triggerはaria-haspopup=dialog/aria-expanded、Contentのdialogはaria-modal=trueを持つ。Title/DescriptionとのARIA参照IDは利用者が指定する。

## フォーム送信

- 種別: `none`
- Trigger/Closeは既定でtype=buttonのためname/valueを送信しない。ドロワー内のフォームコントロールは各自のname/value/disabled規則で送信され、Drawer自体は未選択値や複数値を生成しない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — SSR時は閉じており、接続後はdialog.openを唯一の開閉状態としてStimulusがshowModal/closeする。Ruby側にcontrolledなopen引数はない。
- Stimulus: `shadcn--dialog`
- browser API: HTMLDialogElement.showModal() / HTMLDialogElement.close()
- keyboard: Escapeで開いているモーダルを閉じる。 / Tab移動とフォーカストラップはネイティブdialogへ委ねる。 / EnterまたはSpaceでTrigger/Closeボタンを作動させる。
- CIで確認する操作: `accessibility`、`keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- vaulのReact Drawerではなく、ネイティブdialogとStimulusで開閉する。
- OverlayはContentへ入れず、モーダル背景はdialog::backdropで表現する。
- Portalは公開ラッパーとして描画するだけで、子要素をbody末尾へ移動しない。

### 未対応

- ドラッグ、スワイプ、スナップポイント、入れ子ドロワー、背景スケール。

## CIで描画する代表例を含むpreview定義

`shadcn/drawer/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/drawer_preview.rb](../../../spec/dummy/app/components/previews/shadcn/drawer_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class DrawerPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Drawer.new) do
        safe_join([
          render(Shadcn::Drawer::Trigger.new(variant: :outline)) { "ドロワーを開く" },
          render(Shadcn::Drawer::Content.new) do
            safe_join([
              render(Shadcn::Drawer::Header.new) do
                safe_join([
                  render(Shadcn::Drawer::Title.new) { "お知らせ" },
                  render(Shadcn::Drawer::Description.new) { "下部からスライドインします" }
                ])
              end,
              render(Shadcn::Drawer::Footer.new) do
                render(Shadcn::Drawer::Close.new) { "閉じる" }
              end
            ])
          end
        ])
      end
    end
  end
end
```
