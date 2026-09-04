# `empty` — `Shadcn::Empty`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/empty.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/empty_preview.rb)

空状態の見出し、説明、媒体、追加操作を整列する静的表示コンテナ。

## 構成

- 主コンポーネント: `Shadcn::Empty`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Empty::Header`、`Shadcn::Empty::Title`
- このitemが公開する任意の補助クラス: `Shadcn::Empty::Description`、`Shadcn::Empty::Content`、`Shadcn::Empty::Media`

Header内へTitleを置き、必要に応じてMediaとDescriptionを加える。Contentはボタン等の追加内容を置く任意領域。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Empty`](../../../app/components/shadcn/empty.rb#L5) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `empty` |
| [`Shadcn::Empty::Header`](../../../app/components/shadcn/empty.rb#L6) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `empty-header` |
| [`Shadcn::Empty::Title`](../../../app/components/shadcn/empty.rb#L8) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `empty-title` |
| [`Shadcn::Empty::Description`](../../../app/components/shadcn/empty.rb#L10) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `empty-description` |
| [`Shadcn::Empty::Content`](../../../app/components/shadcn/empty.rb#L12) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `empty-content` |
| [`Shadcn::Empty::Media`](../../../app/components/shadcn/empty.rb#L14) | `new(variant: ShadcnViewComponents::Contracts::Empty::Media::DEFAULTS.fetch(:variant), **args)` | variant: default, icon (default: default) | `empty-icon` |

## HTML attributesの適用先

- 既定: 各公開クラスが描く自身のdata-slot要素。
- Empty::Mediaのvariant:はdata-variantと契約クラスをサーバー描画時に決める。

## フォーム送信

- 種別: `none`
- 表示専用でname/value/disabledや送信値を持たない。Content内へ置いたフォーム部品は各自の契約に従う。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — 表示内容とMedia variantはSSR時に確定し、controlled/uncontrolled状態はない。
- Stimulus: 不要
- browser API: 追加要件なし
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- Reactコンポーネントの構造をViewComponentの明示的なブロック合成として提供する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/empty/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/empty_preview.rb](../../../spec/dummy/app/components/previews/shadcn/empty_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class EmptyPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Empty.new) do
        render(Shadcn::Empty::Header.new) do
          safe_join([
            render(Shadcn::Empty::Media.new(variant: :icon)) { "☑" },
            render(Shadcn::Empty::Title.new) { "データがありません" },
            render(Shadcn::Empty::Description.new) { "新しい項目を追加してください" }
          ])
        end
      end
    end
  end
end
```
