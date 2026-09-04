# `marker` — `Shadcn::Marker`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/marker.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/marker_preview.rb)

アイコンや短い本文をvariant付きで強調表示する静的マーカー。

## 構成

- 主コンポーネント: `Shadcn::Marker`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Marker::Content`
- このitemが公開する任意の補助クラス: `Shadcn::Marker::Icon`

本文はMarker::Contentへ置き、必要な場合だけMarker::Iconを同じMarkerへ加える。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Marker`](../../../app/components/shadcn/marker.rb#L5) | `new(variant: ShadcnViewComponents::Contracts::Marker::DEFAULTS.fetch(:variant), **args)` | variant: border, default, separator (default: default) | `marker` |
| [`Shadcn::Marker::Content`](../../../app/components/shadcn/marker.rb#L31) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `marker-content` |
| [`Shadcn::Marker::Icon`](../../../app/components/shadcn/marker.rb#L34) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `marker-icon` |

## HTML attributesの適用先

- 既定: 各公開クラスが描く自身のdata-slot要素。
- Markerのvariant:はdata-variantと契約クラスへ反映される。

## フォーム送信

- 種別: `none`
- 表示専用でname/value/disabledや送信値を持たない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — variantと内容はSSR時に固定され、controlled/uncontrolled状態はない。
- Stimulus: 不要
- browser API: 追加要件なし
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- ReactのMarker構造を、Content/Iconの明示的なViewComponent合成として提供する。

### 未対応

- render propによる要素差し替え。

## CIで描画する代表例を含むpreview定義

`shadcn/marker/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/marker_preview.rb](../../../spec/dummy/app/components/previews/shadcn/marker_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class MarkerPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Marker.new) { render(Shadcn::Marker::Content.new) { "本文" } }
    end

    def variants
      safe_join(%i[default separator border].map do |variant|
        render(Shadcn::Marker.new(variant: variant)) { render(Shadcn::Marker::Content.new) { variant.to_s } }
      end)
    end
  end
end
```
