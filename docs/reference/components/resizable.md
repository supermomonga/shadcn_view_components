# `resizable` — `Shadcn::Resizable::PanelGroup`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/resizable.rb#L11) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/resizable_preview.rb)

隣接するパネルのflex-basisをドラッグまたはキーボードで変更する。

## 構成

- 主コンポーネント: `Shadcn::Resizable::PanelGroup`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Resizable::Panel`、`Shadcn::Resizable::Handle`
- このitemが公開する任意の補助クラス: なし

PanelGroup内に複数のPanelを置き、その間へHandleを置く。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Resizable::PanelGroup`](../../../app/components/shadcn/resizable.rb#L11) | `new(orientation: self.class.property_default(:orientation), **args)` | orientation: horizontal, vertical (default: "horizontal") | `resizable-panel-group` |
| [`Shadcn::Resizable::Panel`](../../../app/components/shadcn/resizable.rb#L34) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `resizable-panel` |
| [`Shadcn::Resizable::Handle`](../../../app/components/shadcn/resizable.rb#L45) | `new(orientation: self.class.property_default(:orientation), **args)` | orientation: horizontal, vertical (default: "vertical") | `resizable-handle` |

## HTML attributesの適用先

- 既定: PanelGroup、Panel、Handleそれぞれが描画する要素。
- PanelGroupのorientationはdata属性とflex方向へ反映される。
- Handleはrole=separator、tabindex、aria-valuenowを自動設定する。

## フォーム送信

- 種別: `none`
- レイアウト操作でありname/value/disabledやフォーム送信値を持たない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — 初期flex比率はDOMから読み、以後の比率をStimulusが要素styleで管理する。外部controlled比率はない。
- Stimulus: `shadcn--resizable`
- browser API: MouseEvent / getBoundingClientRect
- keyboard: 方向に応じたArrowキーで比率を変更する。 / Home/Endで許容範囲の端へ移動する。
- CIで確認する操作: `keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- react-resizable-panelsではなく隣接要素のflex-basisをStimulusが直接更新する。

### 未対応

- 永続化されたlayoutや外部onLayoutコールバック。

## CIで描画する代表例を含むpreview定義

`shadcn/resizable/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/resizable_preview.rb](../../../spec/dummy/app/components/previews/shadcn/resizable_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class ResizablePreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Resizable::PanelGroup.new(style: "display: flex; height: 200px; width: 100%; border: 1px solid #ccc")) do
        safe_join([
          panel("左パネル"),
          render(Shadcn::Resizable::Handle.new),
          panel("右パネル")
        ])
      end
    end

    def vertical
      render(Shadcn::Resizable::PanelGroup.new(orientation: :vertical,
                                               style: "display: flex; height: 200px; width: 100%; border: 1px solid #ccc")) do
        safe_join([
          panel("上パネル"),
          # ハンドル(セパレータ)自身の向きはグループの逆になる
          render(Shadcn::Resizable::Handle.new(orientation: :horizontal)),
          panel("下パネル")
        ])
      end
    end

    private

    def panel(text)
      render(Shadcn::Resizable::Panel.new) do
        content_tag(:div, style: "padding: 12px") { text }
      end
    end
  end
end
```
