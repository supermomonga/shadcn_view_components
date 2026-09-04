# `dropdown-menu` — `Shadcn::DropdownMenu`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/dropdown_menu.rb#L9) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/dropdown_menu_preview.rb)

Popover APIとARIA menuパターンで開閉・フォーカス移動を提供するメニュー。

## 構成

- 主コンポーネント: `Shadcn::DropdownMenu`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::DropdownMenu::Trigger`、`Shadcn::DropdownMenu::Content`、`Shadcn::DropdownMenu::Item`
- このitemが公開する任意の補助クラス: `Shadcn::DropdownMenu::Portal`、`Shadcn::DropdownMenu::Group`、`Shadcn::DropdownMenu::Label`、`Shadcn::DropdownMenu::CheckboxItem`、`Shadcn::DropdownMenu::RadioGroup`、`Shadcn::DropdownMenu::RadioItem`、`Shadcn::DropdownMenu::Separator`、`Shadcn::DropdownMenu::Shortcut`、`Shadcn::DropdownMenu::Sub`、`Shadcn::DropdownMenu::SubTrigger`、`Shadcn::DropdownMenu::SubContent`

TriggerとContentを同じShadcn::DropdownMenu内へ置く。Group、Label、CheckboxItem、RadioGroup/RadioItem、Separator、Shortcut、Sub/SubTrigger/SubContentは必要なメニュー構造に応じて追加する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::DropdownMenu`](../../../app/components/shadcn/dropdown_menu.rb#L9) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dropdown-menu` |
| [`Shadcn::DropdownMenu::Trigger`](../../../app/components/shadcn/dropdown_menu.rb#L17) | `new(variant: nil, size: nil, **args)`<br>initializerはShadcn::ButtonStyledで定義 | button size: default, icon, icon-lg, icon-sm, icon-xs, lg, sm, xs (未指定時は装飾を追加しない)<br>button variant: default, destructive, ghost, link, outline, secondary (未指定時は装飾を追加しない) | `dropdown-menu-trigger` |
| [`Shadcn::DropdownMenu::Portal`](../../../app/components/shadcn/dropdown_menu.rb#L47) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dropdown-menu-portal` |
| [`Shadcn::DropdownMenu::Content`](../../../app/components/shadcn/dropdown_menu.rb#L51) | `new(side: :bottom, align: :start, side_offset: 4, align_offset: 0, collision_padding: 5, **args)`<br>initializerはShadcn::FloatingPositionOptionsで定義 | side: top / right / bottom / left / inline-start / inline-end (default: :bottom)<br>align: start / center / end (default: :start)<br>side_offset: 有限の数値 (default: 4)<br>align_offset: 有限の数値 (default: 0)<br>collision_padding: 0以上の有限の数値 (default: 5) | `dropdown-menu-content` |
| [`Shadcn::DropdownMenu::Group`](../../../app/components/shadcn/dropdown_menu.rb#L70) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dropdown-menu-group` |
| [`Shadcn::DropdownMenu::Label`](../../../app/components/shadcn/dropdown_menu.rb#L77) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dropdown-menu-label` |
| [`Shadcn::DropdownMenu::Item`](../../../app/components/shadcn/dropdown_menu.rb#L81) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dropdown-menu-item` |
| [`Shadcn::DropdownMenu::CheckboxItem`](../../../app/components/shadcn/dropdown_menu.rb#L105) | `new(checked: false, **args)` | 追加制約なし（signatureどおり） | `dropdown-menu-checkbox-item`<br>`dropdown-menu-checkbox-item-indicator` |
| [`Shadcn::DropdownMenu::RadioGroup`](../../../app/components/shadcn/dropdown_menu.rb#L174) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dropdown-menu-radio-group` |
| [`Shadcn::DropdownMenu::RadioItem`](../../../app/components/shadcn/dropdown_menu.rb#L181) | `new(checked: false, **args)`<br>initializerはShadcn::DropdownMenu::CheckboxItemで定義 | 追加制約なし（signatureどおり） | `dropdown-menu-radio-item`<br>`dropdown-menu-radio-item-indicator` |
| [`Shadcn::DropdownMenu::Separator`](../../../app/components/shadcn/dropdown_menu.rb#L205) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dropdown-menu-separator` |
| [`Shadcn::DropdownMenu::Shortcut`](../../../app/components/shadcn/dropdown_menu.rb#L209) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dropdown-menu-shortcut` |
| [`Shadcn::DropdownMenu::Sub`](../../../app/components/shadcn/dropdown_menu.rb#L213) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dropdown-menu-sub` |
| [`Shadcn::DropdownMenu::SubTrigger`](../../../app/components/shadcn/dropdown_menu.rb#L217) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `dropdown-menu-sub-trigger` |
| [`Shadcn::DropdownMenu::SubContent`](../../../app/components/shadcn/dropdown_menu.rb#L233) | `new(side: :right, align: :start, side_offset: 0, align_offset: -3, collision_padding: 5, **args)`<br>initializerはShadcn::FloatingPositionOptionsで定義 | side: top / right / bottom / left / inline-start / inline-end (default: :right)<br>align: start / center / end (default: :start)<br>side_offset: 有限の数値 (default: 0)<br>align_offset: 有限の数値 (default: -3)<br>collision_padding: 0以上の有限の数値 (default: 5) | `dropdown-menu-sub-content` |

## HTML attributesの適用先

- 既定: 各公開クラスが描く自身のdata-slot要素。
- Content/SubContentにはrole=menu、popover=auto、tabindex=-1と浮動配置data属性が加わる。
- Triggerはtype未指定時にtype=buttonとなり、aria-haspopup/expandedと開閉actionが加わる。
- CheckboxItem/RadioItemのchecked:はaria-checkedと装飾indicatorだけへ反映され、実inputは描かない。

## フォーム送信

- 種別: `none`
- Item、CheckboxItem、RadioItemは実フォームコントロールではなく、name/value/disabledの送信契約を持たない。checked項目も送信されず、未選択・複数値を表すhidden inputは生成しない。Triggerはtype=buttonである。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — 開閉、現在のフォーカス、data-highlightedはPopover APIとStimulusが所有する。checked:はサーバー描画時の表示値で、作動後に自動反転するcontrolled/uncontrolled選択モデルはない。
- Stimulus: `shadcn--menu`
- browser API: HTML Popover API / CSSOM geometry for floating positioning
- keyboard: ArrowDown/ArrowUpで項目間を巡回する。 / Home/Endで先頭・末尾へ移動する。 / ArrowRightでサブメニューを開き、ArrowLeftで親へ戻る。 / Enter/Spaceで項目を作動させ、Escapeで閉じてTriggerへ戻る。 / Tabでメニューを閉じ、通常のフォーカス移動を続ける。
- CIで確認する操作: `keyboard`、`pointer`、`position`、`state`

## upstreamとの差異・未対応機能

### 差異

- Base UIのReact menuではなく、SSR済みARIA要素、Popover API、Stimulusで構成する。
- CheckboxItem/RadioItemはフォーム入力やクライアント選択モデルを内包しない。

### 未対応

- 文字入力によるtypeahead検索。
- controlled open/checked値とonOpenChange/onCheckedChange相当のコールバック。

## CIで描画する代表例を含むpreview定義

`shadcn/dropdown_menu/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/dropdown_menu_preview.rb](../../../spec/dummy/app/components/previews/shadcn/dropdown_menu_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class DropdownMenuPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::DropdownMenu.new) do
        safe_join([
          render(Shadcn::DropdownMenu::Trigger.new(variant: :outline)) { "メニューを開く" },
          render(Shadcn::DropdownMenu::Content.new) do
            safe_join([
              # upstream(base-nova)の Label は Menu.GroupLabel への写像のため
              # Group 内で使うのが正構成(Group 外では upstream が文脈エラーになる)
              render(Shadcn::DropdownMenu::Group.new) do
                safe_join([
                  render(Shadcn::DropdownMenu::Label.new) { "操作" },
                  render(Shadcn::DropdownMenu::Item.new) { "コピー" },
                  render(Shadcn::DropdownMenu::Item.new) do
                    safe_join(["貼り付け", render(Shadcn::DropdownMenu::Shortcut.new) { "⌘V" }])
                  end
                ])
              end,
              render(Shadcn::DropdownMenu::Separator.new),
              render(Shadcn::DropdownMenu::CheckboxItem.new(checked: true)) { "通知を受け取る" },
              render(Shadcn::DropdownMenu::RadioGroup.new) do
                render(Shadcn::DropdownMenu::RadioItem.new(checked: true)) { "簡易表示" }
              end
            ])
          end
        ])
      end
    end
  end
end
```
