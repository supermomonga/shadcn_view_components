# `context-menu` — `Shadcn::ContextMenu`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/context_menu.rb#L10) / [代表preview](../../spec/dummy/app/components/previews/shadcn/context_menu_preview.rb)

右クリック位置へ表示するARIA menu。

## 構成

- 主コンポーネント: `Shadcn::ContextMenu`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::ContextMenu::Trigger`、`Shadcn::ContextMenu::Content`、`Shadcn::ContextMenu::Item`
- このitemが公開する任意の補助クラス: `Shadcn::ContextMenu::Portal`、`Shadcn::ContextMenu::Group`、`Shadcn::ContextMenu::Label`、`Shadcn::ContextMenu::CheckboxItem`、`Shadcn::ContextMenu::RadioGroup`、`Shadcn::ContextMenu::RadioItem`、`Shadcn::ContextMenu::Separator`、`Shadcn::ContextMenu::Shortcut`、`Shadcn::ContextMenu::Sub`、`Shadcn::ContextMenu::SubTrigger`、`Shadcn::ContextMenu::SubContent`

CheckboxItem、RadioGroupとRadioItem、SubとSubTriggerとSubContentは必要な選択・階層構造に応じて使う。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::ContextMenu`](../../app/components/shadcn/context_menu.rb#L10) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `context-menu` |
| [`Shadcn::ContextMenu::Trigger`](../../app/components/shadcn/context_menu.rb#L11) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `context-menu-trigger` |
| [`Shadcn::ContextMenu::Portal`](../../app/components/shadcn/context_menu.rb#L23) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `context-menu-portal` |
| [`Shadcn::ContextMenu::Content`](../../app/components/shadcn/context_menu.rb#L27) | `new(side: :right, align: :start, side_offset: 0, align_offset: 4, collision_padding: 5, **args)`<br>initializerはShadcn::FloatingPositionOptionsで定義 | side: top / right / bottom / left / inline-start / inline-end (default: :right)<br>align: start / center / end (default: :start)<br>side_offset: 有限の数値 (default: 0)<br>align_offset: 有限の数値 (default: 4)<br>collision_padding: 0以上の有限の数値 (default: 5) | `context-menu-content` |
| [`Shadcn::ContextMenu::Group`](../../app/components/shadcn/context_menu.rb#L40) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `context-menu-group` |
| [`Shadcn::ContextMenu::Label`](../../app/components/shadcn/context_menu.rb#L42) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `context-menu-label` |
| [`Shadcn::ContextMenu::Item`](../../app/components/shadcn/context_menu.rb#L44) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `context-menu-item` |
| [`Shadcn::ContextMenu::CheckboxItem`](../../app/components/shadcn/context_menu.rb#L46) | `new(checked: false, **args)`<br>initializerはShadcn::DropdownMenu::CheckboxItemで定義 | 追加制約なし（signatureどおり） | `context-menu-checkbox-item` |
| [`Shadcn::ContextMenu::RadioGroup`](../../app/components/shadcn/context_menu.rb#L54) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `context-menu-radio-group` |
| [`Shadcn::ContextMenu::RadioItem`](../../app/components/shadcn/context_menu.rb#L56) | `new(checked: false, **args)`<br>initializerはShadcn::DropdownMenu::CheckboxItemで定義 | 追加制約なし（signatureどおり） | `context-menu-radio-item` |
| [`Shadcn::ContextMenu::Separator`](../../app/components/shadcn/context_menu.rb#L64) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `context-menu-separator` |
| [`Shadcn::ContextMenu::Shortcut`](../../app/components/shadcn/context_menu.rb#L66) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `context-menu-shortcut` |
| [`Shadcn::ContextMenu::Sub`](../../app/components/shadcn/context_menu.rb#L68) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `context-menu-sub` |
| [`Shadcn::ContextMenu::SubTrigger`](../../app/components/shadcn/context_menu.rb#L70) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `context-menu-sub-trigger` |
| [`Shadcn::ContextMenu::SubContent`](../../app/components/shadcn/context_menu.rb#L72) | `new(side: :right, align: :start, side_offset: 0, align_offset: 4, collision_padding: 5, **args)`<br>initializerはShadcn::FloatingPositionOptionsで定義 | side: top / right / bottom / left / inline-start / inline-end (default: :right)<br>align: start / center / end (default: :start)<br>side_offset: 有限の数値 (default: 0)<br>align_offset: 有限の数値 (default: 4)<br>collision_padding: 0以上の有限の数値 (default: 5) | `context-menu-sub-content` |

## HTML attributesの適用先

- 既定: Shadcn::ContextMenu
- 右クリック対象の属性はTriggerへ、配置属性はContent/SubContentへ、選択値やdisabledは各Itemへ渡す。

## フォーム送信

- 種別: `none`
- menu項目はフォームcontrolではなくname/valueを送信しない。CheckboxItemとRadioItemの状態もフォーム値にはならない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — 開閉とactive itemはStimulusがDOM上で保持する。checkbox/radioのchecked表示はサーバー描画値で、操作しても自動反転せずcontrolled APIもない。
- Stimulus: `shadcn--menu`
- browser API: Popover API / contextmenu event
- keyboard: 右クリックまたはContext Menu操作で開く。 / 上下矢印で項目移動する。 / HomeとEndで端へ移動する。 / EnterまたはSpaceで実行する。 / 右矢印でsubmenuを開き左矢印で戻る。 / Escapeで閉じる。
- CIで確認する操作: `keyboard`、`pointer`、`position`、`state`

## upstreamとの差異・未対応機能

### 差異

- Base UI ContextMenu primitiveの代わりにPopover APIと共通menu controllerを使う。

### 未対応

- controlled open、modal設定、collision middlewareの完全互換、checkbox/radioのchecked自動更新と変更callback。

## CIで描画する代表例を含むpreview定義

`shadcn/context_menu/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/context_menu_preview.rb](../../spec/dummy/app/components/previews/shadcn/context_menu_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class ContextMenuPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::ContextMenu.new) do
        safe_join([
          render(Shadcn::ContextMenu::Trigger.new(class: "rounded-md border p-8", style: "display: inline-block")) do
            "ここを右クリック"
          end,
          render(Shadcn::ContextMenu::Content.new) do
            safe_join([
              render(Shadcn::ContextMenu::Item.new) { "開く" },
              render(Shadcn::ContextMenu::Item.new) { "名前を変更" },
              render(Shadcn::ContextMenu::Separator.new),
              render(Shadcn::ContextMenu::Item.new) { "削除" }
            ])
          end
        ])
      end
    end
  end
end
```
