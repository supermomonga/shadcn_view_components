# `progress` — `Shadcn::Progress`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/progress.rb#L6) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/progress_preview.rb)

0から100までの進捗値をARIA付きのバーとして表示する。

## 構成

- 主コンポーネント: `Shadcn::Progress`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

trackとindicatorはProgress自身が生成するため公開子クラスは不要。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Progress`](../../../app/components/shadcn/progress.rb#L6) | `new(value: self.class.property_default(:value), **args)` | value: number, >= 0, <= 100, nil可 (default: nil) | `progress` |

## HTML attributesの適用先

- 既定: role=progressbarを持つルート要素。
- valueはaria-valuenowとindicatorの幅へ反映され、未指定時はaria-valuenowを出さない。

## フォーム送信

- 種別: `none`
- フォームコントロールではなく、name/value/disabledおよび送信値を持たない。

## 状態・JavaScript・キーボード

- 状態モデル: `server` — valueは描画時に確定し、ブラウザ側で変更するcontrolled/uncontrolled APIはない。
- Stimulus: 不要
- browser API: ARIA progressbar semantics
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- サーバー描画時にindicator幅とARIA値を確定するRubyコンポーネントである。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/progress/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/progress_preview.rb](../../../spec/dummy/app/components/previews/shadcn/progress_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class ProgressPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Progress.new(value: 60, aria: { label: "アップロード進捗" }))
    end
  end
end
```
