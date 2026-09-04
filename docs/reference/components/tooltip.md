# `tooltip` — `Shadcn::Tooltip`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/tooltip.rb#L7) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/tooltip_preview.rb)

hoverまたはfocus時に遅延表示する説明用ツールチップ。

## 構成

- 主コンポーネント: `Shadcn::Tooltip`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Tooltip::Trigger`、`Shadcn::Tooltip::Content`
- このitemが公開する任意の補助クラス: `Shadcn::Tooltip::Provider`

Providerは配置できるが、各Tooltipの動作に必須ではない。Contentはarrowを自動生成する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Tooltip`](../../../app/components/shadcn/tooltip.rb#L7) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `tooltip` |
| [`Shadcn::Tooltip::Provider`](../../../app/components/shadcn/tooltip.rb#L15) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `tooltip-provider` |
| [`Shadcn::Tooltip::Trigger`](../../../app/components/shadcn/tooltip.rb#L19) | `new(variant: nil, size: nil, **args)`<br>initializerはShadcn::ButtonStyledで定義 | button size: default, icon, icon-lg, icon-sm, icon-xs, lg, sm, xs (未指定時は装飾を追加しない)<br>button variant: default, destructive, ghost, link, outline, secondary (未指定時は装飾を追加しない) | `tooltip-trigger` |
| [`Shadcn::Tooltip::Content`](../../../app/components/shadcn/tooltip.rb#L40) | `new(side: :top, align: :center, side_offset: 4, align_offset: 0, collision_padding: 5, **args)`<br>initializerはShadcn::FloatingPositionOptionsで定義 | side: top / right / bottom / left / inline-start / inline-end (default: :top)<br>align: start / center / end (default: :center)<br>side_offset: 有限の数値 (default: 4)<br>align_offset: 有限の数値 (default: 0)<br>collision_padding: 0以上の有限の数値 (default: 5) | `tooltip-content` |

## HTML attributesの適用先

- 既定: root属性はcontroller host、TriggerとContentの属性は各要素。
- Triggerはtype=buttonが既定。
- ContentはARIA role=tooltip、hidden、浮動位置data属性を持つ。Contentへidを指定するとStimulusがTriggerのaria-describedbyへ接続する。

## フォーム送信

- 種別: `none`
- Triggerは既定でtype=buttonのためフォームを送信しない。name/value/disabledや送信値はコンポーネントでは管理しない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — 表示タイマーとopen/closedはStimulusがhover/focusから管理する。外部controlled openはない。
- Stimulus: `shadcn--tooltip`
- browser API: CSS Anchor Positioning（対応時。非対応時は座標計算） / setTimeout
- keyboard: Tab等でTriggerへfocusすると表示し、blurで閉じる。 / Escapeによる明示的な閉鎖は提供しない。
- CIで確認する操作: `keyboard`、`pointer`、`position`、`state`

## upstreamとの差異・未対応機能

### 差異

- React Tooltip primitive/provider状態ではなくDOMイベント、Stimulus、遅延タイマーで表示する。

### 未対応

- 外部controlled open/onOpenChange。
- Providerによる複数Tooltip間の遅延共有。

## CIで描画する代表例を含むpreview定義

`shadcn/tooltip/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/tooltip_preview.rb](../../../spec/dummy/app/components/previews/shadcn/tooltip_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class TooltipPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Tooltip::Provider.new) do
        render(Shadcn::Tooltip.new) do
          safe_join([
            render(Shadcn::Tooltip::Trigger.new(variant: :outline)) { "ホバーしてね" },
            render(Shadcn::Tooltip::Content.new(id: "preview-tip")) { "ツールチップの内容" }
          ])
        end
      end
    end
  end
end
```
