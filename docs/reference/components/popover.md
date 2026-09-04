# `popover` — `Shadcn::Popover`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/popover.rb#L9) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/popover_preview.rb)

トリガーを基準に補助内容を重ねて表示するポップオーバー。

## 構成

- 主コンポーネント: `Shadcn::Popover`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Popover::Trigger`、`Shadcn::Popover::Content`
- このitemが公開する任意の補助クラス: `Shadcn::Popover::Header`、`Shadcn::Popover::Title`、`Shadcn::Popover::Description`

Header、Title、Descriptionは内容の構造化に使う任意の子要素。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Popover`](../../../app/components/shadcn/popover.rb#L9) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `popover` |
| [`Shadcn::Popover::Trigger`](../../../app/components/shadcn/popover.rb#L17) | `new(variant: nil, size: nil, **args)`<br>initializerはShadcn::ButtonStyledで定義 | button size: default, icon, icon-lg, icon-sm, icon-xs, lg, sm, xs (未指定時は装飾を追加しない)<br>button variant: default, destructive, ghost, link, outline, secondary (未指定時は装飾を追加しない) | `popover-trigger` |
| [`Shadcn::Popover::Content`](../../../app/components/shadcn/popover.rb#L37) | `new(side: :bottom, align: :center, side_offset: 4, align_offset: 0, collision_padding: 5, **args)`<br>initializerはShadcn::FloatingPositionOptionsで定義 | side: top / right / bottom / left / inline-start / inline-end (default: :bottom)<br>align: start / center / end (default: :center)<br>side_offset: 有限の数値 (default: 4)<br>align_offset: 有限の数値 (default: 0)<br>collision_padding: 0以上の有限の数値 (default: 5) | `popover-content` |
| [`Shadcn::Popover::Header`](../../../app/components/shadcn/popover.rb#L53) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `popover-header` |
| [`Shadcn::Popover::Title`](../../../app/components/shadcn/popover.rb#L57) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `popover-title` |
| [`Shadcn::Popover::Description`](../../../app/components/shadcn/popover.rb#L61) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `popover-description` |

## HTML attributesの適用先

- 既定: 各公開クラスが描画する要素。Contentはpopover属性を持つ浮動要素。
- Triggerのtype既定値はbutton。
- Contentのpopoverはautoに固定される。

## フォーム送信

- 種別: `none`
- Triggerは既定でtype=buttonのためフォームを送信しない。name/value/disabledや送信値はコンポーネントでは管理しない。

## 状態・JavaScript・キーボード

- 状態モデル: `native` — 開閉の唯一の実状態はPopover APIが持ち、Stimulusはdata属性とaria-expandedを同期する。外部controlled値はない。
- Stimulus: `shadcn--popover`
- browser API: Popover API / CSS Anchor Positioning（対応時。非対応時は座標計算）
- keyboard: Escapeでautoポップオーバーを閉じる。 / Triggerのbutton標準操作で開閉する。
- CIで確認する操作: `keyboard`、`pointer`、`position`、`state`

## upstreamとの差異・未対応機能

### 差異

- React primitiveではなくブラウザのPopover APIとStimulusで開閉・位置決めする。

### 未対応

- 外部controlled open/onOpenChange。
- 独立したAnchor子コンポーネント。

## CIで描画する代表例を含むpreview定義

`shadcn/popover/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/popover_preview.rb](../../../spec/dummy/app/components/previews/shadcn/popover_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class PopoverPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Popover.new) do
        safe_join([
          render(Shadcn::Popover::Trigger.new(variant: :outline)) { "開く" },
          render(Shadcn::Popover::Content.new) do
            safe_join([
              render(Shadcn::Popover::Header.new) do
                safe_join([
                  render(Shadcn::Popover::Title.new) { "寸法" },
                  render(Shadcn::Popover::Description.new) { "ポップオーバーの内容です" }
                ])
              end
            ])
          end
        ])
      end
    end
  end
end
```
