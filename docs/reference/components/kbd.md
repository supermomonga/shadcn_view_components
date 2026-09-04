# `kbd` — `Shadcn::Kbd`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/kbd.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/kbd_preview.rb)

キー名やショートカット列を視覚表示する静的kbd部品。

## 構成

- 主コンポーネント: `Shadcn::Kbd`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: `Shadcn::Kbd::Group`

単一キーはShadcn::Kbdへ文字列を渡す。複数キーは任意のShadcn::Kbd::Group内へKbdを並べる。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Kbd`](../../../app/components/shadcn/kbd.rb#L5) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `kbd` |
| [`Shadcn::Kbd::Group`](../../../app/components/shadcn/kbd.rb#L6) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `kbd-group` |

## HTML attributesの適用先

- 既定: KbdまたはKbd::Groupが描く自身のdata-slot要素。
- 例外なし。

## フォーム送信

- 種別: `none`
- 表示専用でname/value/disabledや送信値を持たない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — 表示文字列はSSR時に固定され、controlled/uncontrolled状態はない。
- Stimulus: 不要
- browser API: 追加要件なし
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- Reactコンポーネントではなく、サーバー描画のKbd/Kbd::Groupとして提供する。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/kbd/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/kbd_preview.rb](../../../spec/dummy/app/components/previews/shadcn/kbd_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class KbdPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Kbd.new) { "⌘" }
    end

    def group
      render(Shadcn::Kbd::Group.new) do
        safe_join([render(Shadcn::Kbd.new) { "⌘" }, render(Shadcn::Kbd.new) { "K" }])
      end
    end
  end
end
```
