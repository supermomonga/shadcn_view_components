# `avatar` — `Shadcn::Avatar`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/avatar.rb#L5) / [代表preview](../../spec/dummy/app/components/previews/shadcn/avatar_preview.rb)

画像と代替表示をまとめるアバター。

## 構成

- 主コンポーネント: `Shadcn::Avatar`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: `Shadcn::Avatar::Image`、`Shadcn::Avatar::Fallback`、`Shadcn::Avatar::Badge`、`Shadcn::Avatar::Group`、`Shadcn::Avatar::Group::Count`

ImageとFallbackを用途に応じて置き、BadgeやGroupは任意に使う。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Avatar`](../../app/components/shadcn/avatar.rb#L5) | `new(size: self.class.property_default(:size), **args)` | size: default, sm, lg (default: "default") | `avatar` |
| [`Shadcn::Avatar::Image`](../../app/components/shadcn/avatar.rb#L32) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `avatar-image` |
| [`Shadcn::Avatar::Fallback`](../../app/components/shadcn/avatar.rb#L40) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `avatar-fallback` |
| [`Shadcn::Avatar::Badge`](../../app/components/shadcn/avatar.rb#L47) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `avatar-badge` |
| [`Shadcn::Avatar::Group`](../../app/components/shadcn/avatar.rb#L50) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `avatar-group` |
| [`Shadcn::Avatar::Group::Count`](../../app/components/shadcn/avatar.rb#L51) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `avatar-group-count` |

## HTML attributesの適用先

- 既定: Shadcn::Avatar
- srcとaltはImageへ、グループ件数はGroup::Countへ渡す。

## フォーム送信

- 種別: `none`
- フォーム値は送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `static` — sizeと表示内容はサーバ描画で確定し、画像失敗を切り替える内部状態はない。
- Stimulus: 不要
- browser API: HTML image element
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- Base UI Avatar primitiveの画像ロード状態管理を持たず、ImageとFallbackをそのままSSRする。

### 未対応

- 画像ロード失敗時のFallback自動切替。

## CIで描画する代表例を含むpreview定義

`shadcn/avatar/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/avatar_preview.rb](../../spec/dummy/app/components/previews/shadcn/avatar_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class AvatarPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Avatar.new) do
        render(Shadcn::Avatar::Fallback.new) { "AB" }
      end
    end

    def sizes
      safe_join(%i[sm default lg].map do |size|
        render(Shadcn::Avatar.new(size: size)) { render(Shadcn::Avatar::Fallback.new) { size.to_s } }
      end)
    end

    def group
      render(Shadcn::Avatar::Group.new) do
        safe_join([
          render(Shadcn::Avatar.new) { render(Shadcn::Avatar::Fallback.new) { "A" } },
          render(Shadcn::Avatar.new) { render(Shadcn::Avatar::Fallback.new) { "B" } },
          render(Shadcn::Avatar.new) { render(Shadcn::Avatar::Fallback.new) { "C" } }
        ])
      end
    end
  end
end
```
