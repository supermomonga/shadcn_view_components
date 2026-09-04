# `menubar` — `Shadcn::Menubar`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/menubar.rb#L9) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/menubar_preview.rb)

複数のARIA menuを横並びに束ね、トップレベルと各メニューのフォーカスを管理するmenubar。

## 構成

- 主コンポーネント: `Shadcn::Menubar`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Menubar::Menu`、`Shadcn::Menubar::Trigger`、`Shadcn::Menubar::Content`、`Shadcn::Menubar::Item`
- このitemが公開する任意の補助クラス: `Shadcn::Menubar::Portal`、`Shadcn::Menubar::Group`、`Shadcn::Menubar::Label`、`Shadcn::Menubar::Shortcut`、`Shadcn::Menubar::CheckboxItem`、`Shadcn::Menubar::RadioGroup`、`Shadcn::Menubar::RadioItem`、`Shadcn::Menubar::Separator`、`Shadcn::Menubar::Sub`、`Shadcn::Menubar::SubTrigger`、`Shadcn::Menubar::SubContent`

各Menu内へ対応するTriggerとContentを置き、Content内へItem群を置く。Group、Label、CheckboxItem、RadioGroup/RadioItem、Sub系はDropdownMenuと同様に任意追加する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Menubar`](../../../app/components/shadcn/menubar.rb#L9) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `menubar` |
| [`Shadcn::Menubar::Menu`](../../../app/components/shadcn/menubar.rb#L38) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `menubar-menu` |
| [`Shadcn::Menubar::Trigger`](../../../app/components/shadcn/menubar.rb#L46) | `new(variant: nil, size: nil, **args)`<br>initializerはShadcn::ButtonStyledで定義 | button size: default, icon, icon-lg, icon-sm, icon-xs, lg, sm, xs (未指定時は装飾を追加しない)<br>button variant: default, destructive, ghost, link, outline, secondary (未指定時は装飾を追加しない) | `menubar-trigger` |
| [`Shadcn::Menubar::Portal`](../../../app/components/shadcn/menubar.rb#L55) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `menubar-portal` |
| [`Shadcn::Menubar::Content`](../../../app/components/shadcn/menubar.rb#L59) | `new(side: :bottom, align: :start, side_offset: 8, align_offset: -4, collision_padding: 5, **args)`<br>initializerはShadcn::FloatingPositionOptionsで定義 | side: top / right / bottom / left / inline-start / inline-end (default: :bottom)<br>align: start / center / end (default: :start)<br>side_offset: 有限の数値 (default: 8)<br>align_offset: 有限の数値 (default: -4)<br>collision_padding: 0以上の有限の数値 (default: 5) | `menubar-content` |
| [`Shadcn::Menubar::Group`](../../../app/components/shadcn/menubar.rb#L68) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `menubar-group` |
| [`Shadcn::Menubar::Label`](../../../app/components/shadcn/menubar.rb#L70) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `menubar-label` |
| [`Shadcn::Menubar::Item`](../../../app/components/shadcn/menubar.rb#L72) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `menubar-item` |
| [`Shadcn::Menubar::Shortcut`](../../../app/components/shadcn/menubar.rb#L100) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `menubar-shortcut` |
| [`Shadcn::Menubar::CheckboxItem`](../../../app/components/shadcn/menubar.rb#L76) | `new(checked: false, **args)`<br>initializerはShadcn::DropdownMenu::CheckboxItemで定義 | 追加制約なし（signatureどおり） | `menubar-checkbox-item` |
| [`Shadcn::Menubar::RadioGroup`](../../../app/components/shadcn/menubar.rb#L86) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `menubar-radio-group` |
| [`Shadcn::Menubar::RadioItem`](../../../app/components/shadcn/menubar.rb#L88) | `new(checked: false, **args)`<br>initializerはShadcn::DropdownMenu::CheckboxItemで定義 | 追加制約なし（signatureどおり） | `menubar-radio-item` |
| [`Shadcn::Menubar::Separator`](../../../app/components/shadcn/menubar.rb#L98) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `menubar-separator` |
| [`Shadcn::Menubar::Sub`](../../../app/components/shadcn/menubar.rb#L102) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `menubar-sub` |
| [`Shadcn::Menubar::SubTrigger`](../../../app/components/shadcn/menubar.rb#L104) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `menubar-sub-trigger` |
| [`Shadcn::Menubar::SubContent`](../../../app/components/shadcn/menubar.rb#L108) | `new(side: :right, align: :start, side_offset: 0, align_offset: -3, collision_padding: 5, **args)`<br>initializerはShadcn::FloatingPositionOptionsで定義 | side: top / right / bottom / left / inline-start / inline-end (default: :right)<br>align: start / center / end (default: :start)<br>side_offset: 有限の数値 (default: 0)<br>align_offset: 有限の数値 (default: -3)<br>collision_padding: 0以上の有限の数値 (default: 5) | `menubar-sub-content` |

## HTML attributesの適用先

- 既定: 各公開クラスが描く自身のdata-slot要素。
- Menubarルートにはrole=menubarとaria-orientation=horizontalが加わる。
- Triggerはrole=menuitem、Content/SubContentはpopover=autoのARIA menuとなる。
- CheckboxItem/RadioItemのchecked:はARIAと装飾だけで、実inputを描かない。

## フォーム送信

- 種別: `none`
- メニュー項目は実フォームコントロールではなくname/value/disabledを送信しない。checked項目、未選択、複数値のhidden inputも生成しない。Triggerはtype=buttonである。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — 開閉、roving tabindex、フォーカス、highlightはPopover APIと専用Stimulus controllerが所有する。checked:はサーバー表示値で、自動更新するcontrolled選択モデルはない。
- Stimulus: `shadcn--menubar`
- browser API: HTML Popover API / CSSOM direction and geometry
- keyboard: ArrowLeft/ArrowRightでRTLを考慮してトップレベルTrigger間を移動する。 / ArrowDown/ArrowUpでメニューを先頭/末尾から開き、項目間を巡回する。 / Home/Endでトップレベルまたは項目の端へ移動する。 / Enter/Spaceで項目を作動させ、Escapeで閉じてTriggerへ戻る。 / Tabで開いたメニューを閉じて通常のフォーカス移動へ戻る。
- CIで確認する操作: `keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- Base UI Menubarではなく、DropdownMenuの描画部品を継承しつつ独立したStimulus状態機械を使う。
- Portalはbodyへ搬送しないラッパーで、Popover APIがtop layerを担う。

### 未対応

- 文字入力によるtypeahead検索。
- controlled open/checked値と変更コールバック。

## CIで描画する代表例を含むpreview定義

`shadcn/menubar/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/menubar_preview.rb](../../../spec/dummy/app/components/previews/shadcn/menubar_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class MenubarPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Menubar.new) do
        render(Shadcn::Menubar::Menu.new) do
          safe_join([
            render(Shadcn::Menubar::Trigger.new) { "ファイル" },
            render(Shadcn::Menubar::Content.new) do
              safe_join([
                render(Shadcn::Menubar::Item.new) { "新規作成" },
                render(Shadcn::Menubar::Item.new) do
                  safe_join(["保存", render(Shadcn::Menubar::Shortcut.new) { "⌘S" }])
                end,
                render(Shadcn::Menubar::Separator.new),
                render(Shadcn::Menubar::Item.new) { "終了" }
              ])
            end
          ])
        end
      end
    end
  end
end
```
