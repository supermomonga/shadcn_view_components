# `sidebar` — `Shadcn::Sidebar`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/sidebar.rb#L10) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/sidebar_preview.rb)

デスクトップ向けサイドバーの構造、初期開閉状態、操作部品を提供する。

## 構成

- 主コンポーネント: `Shadcn::Sidebar`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Sidebar::Provider`、`Shadcn::Sidebar::Trigger`、`Shadcn::Sidebar::Content`
- このitemが公開する任意の補助クラス: `Shadcn::Sidebar::Rail`、`Shadcn::Sidebar::Inset`、`Shadcn::Sidebar::Input`、`Shadcn::Sidebar::Header`、`Shadcn::Sidebar::Footer`、`Shadcn::Sidebar::Separator`、`Shadcn::Sidebar::Group`、`Shadcn::Sidebar::GroupLabel`、`Shadcn::Sidebar::GroupAction`、`Shadcn::Sidebar::GroupContent`、`Shadcn::Sidebar::Menu`、`Shadcn::Sidebar::MenuItem`、`Shadcn::Sidebar::MenuButton`、`Shadcn::Sidebar::MenuAction`、`Shadcn::Sidebar::MenuBadge`、`Shadcn::Sidebar::MenuSkeleton`、`Shadcn::Sidebar::MenuSub`、`Shadcn::Sidebar::MenuSubItem`、`Shadcn::Sidebar::MenuSubButton`

Providerを状態ホストにし、Sidebarと必要なHeader、Footer、Group、Menu系の子要素を組み合わせる。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Sidebar`](../../../app/components/shadcn/sidebar.rb#L10) | `new(state: self.class.property_default(:state), **args)` | state: open, closed (default: "open") | `sidebar`<br>`sidebar-gap`<br>`sidebar-container`<br>`sidebar-inner` |
| [`Shadcn::Sidebar::Provider`](../../../app/components/shadcn/sidebar.rb#L54) | `new(state: self.class.property_default(:state), **args)` | state: open, closed (default: "open") | `sidebar-wrapper` |
| [`Shadcn::Sidebar::Trigger`](../../../app/components/shadcn/sidebar.rb#L71) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-trigger` |
| [`Shadcn::Sidebar::Rail`](../../../app/components/shadcn/sidebar.rb#L107) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-rail` |
| [`Shadcn::Sidebar::Inset`](../../../app/components/shadcn/sidebar.rb#L125) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-inset` |
| [`Shadcn::Sidebar::Input`](../../../app/components/shadcn/sidebar.rb#L133) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-input` |
| [`Shadcn::Sidebar::Header`](../../../app/components/shadcn/sidebar.rb#L145) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-header` |
| [`Shadcn::Sidebar::Footer`](../../../app/components/shadcn/sidebar.rb#L149) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-footer` |
| [`Shadcn::Sidebar::Separator`](../../../app/components/shadcn/sidebar.rb#L153) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-separator` |
| [`Shadcn::Sidebar::Content`](../../../app/components/shadcn/sidebar.rb#L163) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-content` |
| [`Shadcn::Sidebar::Group`](../../../app/components/shadcn/sidebar.rb#L167) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-group` |
| [`Shadcn::Sidebar::GroupLabel`](../../../app/components/shadcn/sidebar.rb#L171) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-group-label` |
| [`Shadcn::Sidebar::GroupAction`](../../../app/components/shadcn/sidebar.rb#L175) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-group-action` |
| [`Shadcn::Sidebar::GroupContent`](../../../app/components/shadcn/sidebar.rb#L183) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-group-content` |
| [`Shadcn::Sidebar::Menu`](../../../app/components/shadcn/sidebar.rb#L187) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-menu` |
| [`Shadcn::Sidebar::MenuItem`](../../../app/components/shadcn/sidebar.rb#L195) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-menu-item` |
| [`Shadcn::Sidebar::MenuButton`](../../../app/components/shadcn/sidebar.rb#L203) | `new(variant: ShadcnViewComponents::Contracts::Sidebar::MenuButton::DEFAULTS.fetch(:variant),<br>                     size: ShadcnViewComponents::Contracts::Sidebar::MenuButton::DEFAULTS.fetch(:size),<br>                     active: false, **args)` | size: default, lg, sm (default: default)<br>variant: default, outline (default: default) | `sidebar-menu-button` |
| [`Shadcn::Sidebar::MenuAction`](../../../app/components/shadcn/sidebar.rb#L238) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-menu-action` |
| [`Shadcn::Sidebar::MenuBadge`](../../../app/components/shadcn/sidebar.rb#L246) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-menu-badge` |
| [`Shadcn::Sidebar::MenuSkeleton`](../../../app/components/shadcn/sidebar.rb#L250) | `new(show_icon: true, **args)` | 追加制約なし（signatureどおり） | `sidebar-menu-skeleton` |
| [`Shadcn::Sidebar::MenuSub`](../../../app/components/shadcn/sidebar.rb#L287) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-menu-sub` |
| [`Shadcn::Sidebar::MenuSubItem`](../../../app/components/shadcn/sidebar.rb#L295) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `sidebar-menu-sub-item` |
| [`Shadcn::Sidebar::MenuSubButton`](../../../app/components/shadcn/sidebar.rb#L303) | `new(size: self.class.property_default(:size), active: false, **args)` | size: sm, md (default: "md") | `sidebar-menu-sub-button` |

## HTML attributesの適用先

- 既定: 各公開クラスが描画する要素。Sidebar::InputとSeparatorは対応するShadcnコンポーネントへ属性を渡す。
- SidebarとProviderのstateはdata-stateへ出力される。
- Triggerはtype=buttonでaria-expanded/aria-labelを持ち、Railはtype=button、tabindex=-1、aria-labelを持つ。
- MenuButtonはbuttonが既定だがtag=aへ変更できる。

## フォーム送信

- 種別: `none`
- Sidebar自身はname/value/disabledや送信値を持たない。Inputなど内包したネイティブフォーム部品は各自のname/value/disabled規則で送信され、Trigger/Railは送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — stateはSSR初期値で、接続後のopen/closedはProvider配下のStimulusが管理する。サーバーは再描画時に初期値を再提示できるが外部controlled APIはない。
- Stimulus: `shadcn--sidebar`
- browser API: DOM data attributes
- keyboard: TriggerのEnter/Spaceで開閉する。 / メニュー内のbutton/link/inputは各ネイティブ要素の標準操作に従う。
- CIで確認する操作: `keyboard`、`pointer`、`reconnect`、`state`

## upstreamとの差異・未対応機能

### 差異

- gemはデスクトップとサーバー指定初期状態に限定し、React contextではなくProviderのdata-stateを使う。

### 未対応

- モバイルSheet切替。
- cookieによる状態永続化。
- 上流のcontext controlled open/onOpenChange。

## CIで描画する代表例を含むpreview定義

`shadcn/sidebar/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/sidebar_preview.rb](../../../spec/dummy/app/components/previews/shadcn/sidebar_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class SidebarPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Sidebar::Provider.new) do
        safe_join([
                    render(Shadcn::Sidebar::Trigger.new),
                    render(Shadcn::Sidebar.new(aria: { label: "メインナビゲーション" })) do
                      render(Shadcn::Sidebar::Content.new) do
                        render(Shadcn::Sidebar::Menu.new) do
                          render(Shadcn::Sidebar::MenuItem.new) do
                            render(Shadcn::Sidebar::MenuButton.new) { "ホーム" }
                          end
                        end
                      end
                    end
                  ])
      end
    end
  end
end
```
