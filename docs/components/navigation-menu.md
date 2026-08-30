# `navigation-menu` — `Shadcn::NavigationMenu`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/navigation_menu.rb#L9) / [代表preview](../../spec/dummy/app/components/previews/shadcn/navigation_menu_preview.rb)

ネイティブnav/linkを保ちながら、必要な項目だけPopoverで展開するナビゲーション。

## 構成

- 主コンポーネント: `Shadcn::NavigationMenu`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::NavigationMenu::List`、`Shadcn::NavigationMenu::Item`
- このitemが公開する任意の補助クラス: `Shadcn::NavigationMenu::Content`、`Shadcn::NavigationMenu::Trigger`、`Shadcn::NavigationMenu::Link`、`Shadcn::NavigationMenu::Indicator`

Item内へ直接Linkを置くか、Triggerと対応するContentを置く。Content内の移動先はNavigationMenu::Link等のフォーカス可能要素で構成する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::NavigationMenu`](../../app/components/shadcn/navigation_menu.rb#L9) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `navigation-menu` |
| [`Shadcn::NavigationMenu::List`](../../app/components/shadcn/navigation_menu.rb#L22) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `navigation-menu-list` |
| [`Shadcn::NavigationMenu::Item`](../../app/components/shadcn/navigation_menu.rb#L30) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `navigation-menu-item` |
| [`Shadcn::NavigationMenu::Content`](../../app/components/shadcn/navigation_menu.rb#L92) | `new(side: :bottom, align: :start, side_offset: 8, align_offset: 0, collision_padding: 5, **args)`<br>initializerはShadcn::FloatingPositionOptionsで定義 | side: top / right / bottom / left / inline-start / inline-end (default: :bottom)<br>align: start / center / end (default: :start)<br>side_offset: 有限の数値 (default: 8)<br>align_offset: 有限の数値 (default: 0)<br>collision_padding: 0以上の有限の数値 (default: 5) | `navigation-menu-content` |
| [`Shadcn::NavigationMenu::Trigger`](../../app/components/shadcn/navigation_menu.rb#L38) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `navigation-menu-trigger` |
| [`Shadcn::NavigationMenu::Link`](../../app/components/shadcn/navigation_menu.rb#L84) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `navigation-menu-link` |
| [`Shadcn::NavigationMenu::Indicator`](../../app/components/shadcn/navigation_menu.rb#L109) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `navigation-menu-indicator` |

## HTML attributesの適用先

- 既定: 各公開クラスが描く自身のdata-slot要素。
- ルートはnav、Listはul、Itemはli、Linkはa、Triggerはtype=buttonとなる。
- Contentにはpopover=autoと浮動配置data属性が加わる。
- Triggerはchevron SVG、Indicatorは装飾用内側divを自動生成する。

## フォーム送信

- 種別: `none`
- Linkはhrefへ遷移しフォーム値を送信しない。Triggerはtype=buttonでname/valueを送信せず、NavigationMenuはdisabled、未選択、複数値の送信契約を持たない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — Trigger/Contentの対応、開閉、フォーカスはPopover APIとStimulusが所有する。Ruby側にcontrolled open値はなく、通常Linkの遷移状態はブラウザが所有する。
- Stimulus: `shadcn--navigation-menu`
- browser API: HTML Popover API / Native anchor navigation / CSSOM direction and geometry
- keyboard: Tab/Enterは通常Linkのネイティブ操作を維持する。 / ArrowLeft/ArrowRightとHome/EndでRTLを考慮してトップレベル項目を移動する。 / ArrowDown/ArrowUpでTriggerのContentを開き、Content内リンクを巡回する。 / EscapeでContentを閉じTriggerへ戻る。
- CIで確認する操作: `keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- Base UI NavigationMenuではなく、nav/linkとPopover APIを組み合わせたStimulus実装。
- ARIA menuロールを付けず、通常のナビゲーションリンクの意味を保つ。

### 未対応

- base-novaのViewportとPositioner公開コンポーネント。
- controlled value/open状態と変更コールバック。

## CIで描画する代表例を含むpreview定義

`shadcn/navigation_menu/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/navigation_menu_preview.rb](../../spec/dummy/app/components/previews/shadcn/navigation_menu_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class NavigationMenuPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::NavigationMenu.new) do
        render(Shadcn::NavigationMenu::List.new) do
          render(Shadcn::NavigationMenu::Item.new) do
            render(Shadcn::NavigationMenu::Link.new(href: "#")) { "ホーム" }
          end
        end
      end
    end

    def with_trigger
      render(Shadcn::NavigationMenu.new) do
        render(Shadcn::NavigationMenu::List.new) do
          render(Shadcn::NavigationMenu::Item.new) do
            safe_join([
              render(Shadcn::NavigationMenu::Trigger.new) { "ドキュメント" },
              render(Shadcn::NavigationMenu::Content.new) do
                render(Shadcn::NavigationMenu::Link.new(href: "#")) { "はじめに" }
              end
            ])
          end
        end
      end
    end
  end
end
```
