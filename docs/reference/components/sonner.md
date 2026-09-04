# `sonner` — `Shadcn::Sonner::Toaster`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/sonner.rb#L11) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/sonner_preview.rb)

shadcn:toastイベント(detail: title / description / duration)から通知を生成するaria-live通知領域。本gem唯一の通知API。

## 構成

- 主コンポーネント: `Shadcn::Sonner::Toaster`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

Sonnerは名前空間で、Toaster単体をlayoutへ1つ配置する。通知要素はcontrollerがイベント受信時に生成する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Sonner::Toaster`](../../../app/components/shadcn/sonner.rb#L11) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | なし |

## HTML attributesの適用先

- 既定: Shadcn::Sonner::Toasterが描画するsection。
- aria-live=politeとshadcn--toast controllerを既定設定する。

## フォーム送信

- 種別: `none`
- 通知領域でありname/value/disabledやフォーム送信値を持たない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — 通知の追加・破棄とタイマーはStimulusが所有し、shadcn:toastイベントが入力になる。サーバーcontrolled通知配列はない。
- Stimulus: `shadcn--toast`
- browser API: CustomEvent / setTimeout / ARIA live region
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: `accessibility`、`event`、`state`、`timing`

## upstreamとの差異・未対応機能

### 差異

- sonner Reactライブラリのportal/storeではなくCustomEventとStimulusで通知とタイマーを管理する。
- base-novaではtoast(Base UI専用)が通知の正本だが、本gemは既存Sonnerへ一本化する意図的な差異である。
- 通知要素のクラスはtoast_controller.js内の手書き文字列(既知の限界であり、手書きクラスを許す前例ではない)。

### 未対応

- sonnerライブラリ固有の命令的APIとReact portal。
- Actionボタン(操作を伴う通知はShadcn::Alertやdialogで代替)。
- 通知を手動で閉じるClose button。
- type / priority(success / error等の区分とrole=alert切替)。
- hover / focus / 非表示タブでのタイマー一時停止。
- swipe dismiss。
- promise / loading状態の通知。

## CIで描画する代表例を含むpreview定義

`shadcn/sonner/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/sonner_preview.rb](../../../spec/dummy/app/components/previews/shadcn/sonner_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class SonnerPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Sonner::Toaster.new(aria: { label: "通知" }))
    end
  end
end
```
