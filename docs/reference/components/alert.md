# `alert` — `Shadcn::Alert`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/alert.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/alert_preview.rb)

状態メッセージを表示する静的なalert領域。

## 構成

- 主コンポーネント: `Shadcn::Alert`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: `Shadcn::Alert::Title`、`Shadcn::Alert::Description`

TitleとDescriptionは内容に応じて任意に組み合わせる。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Alert`](../../../app/components/shadcn/alert.rb#L5) | `new(variant: ShadcnViewComponents::Contracts::Alert::DEFAULTS.fetch(:variant), **args)` | variant: default, destructive (default: default) | `alert` |
| [`Shadcn::Alert::Title`](../../../app/components/shadcn/alert.rb#L25) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `alert-title` |
| [`Shadcn::Alert::Description`](../../../app/components/shadcn/alert.rb#L28) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `alert-description` |

## HTML attributesの適用先

- 既定: Shadcn::Alert
- 見出しと説明の属性はShadcn::Alert::TitleまたはDescriptionへ渡す。

## フォーム送信

- 種別: `none`
- フォーム値は送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — variantはサーバ描画時に確定し、クライアント状態を持たない。
- Stimulus: 不要
- browser API: 追加要件なし
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- Reactを使わず同じroleとslotをViewComponentで描画する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/alert/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/alert_preview.rb](../../../spec/dummy/app/components/previews/shadcn/alert_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class AlertPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Alert.new) do
        safe_join([render(Shadcn::Alert::Title.new) { "注意" }, render(Shadcn::Alert::Description.new) { "説明テキスト" }])
      end
    end

    def destructive
      render(Shadcn::Alert.new(variant: :destructive)) do
        safe_join([render(Shadcn::Alert::Title.new) { "エラー" }, render(Shadcn::Alert::Description.new) { "破壊的な内容" }])
      end
    end
  end
end
```
