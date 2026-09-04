# `badge` — `Shadcn::Badge`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/badge.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/badge_preview.rb)

短い状態や分類を示すインラインラベル。

## 構成

- 主コンポーネント: `Shadcn::Badge`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

テキストまたはアイコンをrootの内容として渡す。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Badge`](../../../app/components/shadcn/badge.rb#L5) | `new(variant: ShadcnViewComponents::Contracts::Badge::DEFAULTS.fetch(:variant), **args)` | variant: default, destructive, ghost, link, outline, secondary (default: default) | `badge` |

## HTML attributesの適用先

- 既定: Shadcn::Badge
- 例外なし。

## フォーム送信

- 種別: `none`
- フォーム値は送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — variantはサーバ描画時に確定する。
- Stimulus: 不要
- browser API: 追加要件なし
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- render propの代わりにtag差し替えでリンク等の要素を描画する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/badge/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/badge_preview.rb](../../../spec/dummy/app/components/previews/shadcn/badge_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class BadgePreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Badge.new) { "Badge" }
    end

    def variants
      safe_join(%i[default secondary destructive outline ghost link].map do |variant|
        render(Shadcn::Badge.new(variant: variant)) { variant.to_s }
      end)
    end
  end
end
```
