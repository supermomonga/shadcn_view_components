# `skeleton` — `Shadcn::Skeleton`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/skeleton.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/skeleton_preview.rb)

読み込み中の内容位置を示す静的なプレースホルダー。

## 構成

- 主コンポーネント: `Shadcn::Skeleton`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

単一要素で完結し、形状はclassで指定する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Skeleton`](../../../app/components/shadcn/skeleton.rb#L5) | `new(**args)` | 追加制約なし（signatureどおり） | `skeleton` |

## HTML attributesの適用先

- 既定: Skeletonのroot要素。
- 例外なし。

## フォーム送信

- 種別: `none`
- 表示専用でname/value/disabledや送信値を持たない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — 読み込み状態の切替は呼び出し側が描画有無で管理し、コンポーネント内部状態はない。
- Stimulus: 不要
- browser API: 追加要件なし
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- React関数ではなく同じ静的プレースホルダー要素をRubyでサーバー描画する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/skeleton/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/skeleton_preview.rb](../../../spec/dummy/app/components/previews/shadcn/skeleton_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class SkeletonPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Skeleton.new(class: "h-8 w-full"))
    end
  end
end
```
