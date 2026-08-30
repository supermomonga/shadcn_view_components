# `button` — `Shadcn::Button`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/button.rb#L5) / [代表preview](../../spec/dummy/app/components/previews/shadcn/button_preview.rb)

ネイティブbuttonまたは差し替えたリンクを共通スタイルで描画する。

## 構成

- 主コンポーネント: `Shadcn::Button`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

ラベルを内容として渡し、必要ならtag=:aでリンクにする。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Button`](../../app/components/shadcn/button.rb#L5) | `new(variant: ShadcnViewComponents::Contracts::Button::DEFAULTS.fetch(:variant),<br>                   size: ShadcnViewComponents::Contracts::Button::DEFAULTS.fetch(:size), **args)` | size: default, icon, icon-lg, icon-sm, icon-xs, lg, sm, xs (default: default)<br>variant: default, destructive, ghost, link, outline, secondary (default: default) | `button` |

## HTML attributesの適用先

- 既定: Shadcn::Button
- aria-label等のARIA属性は実buttonへそのまま渡る。

## フォーム送信

- 種別: `action`
- button時のname/value/disabled/typeはネイティブ要素へ渡る。submitとして実行された時だけsuccessful controlとなり、nameがあればname=valueを一件送信する。disabledなら送信せず、value省略時の送信値は空文字列。type省略時はHTML既定のsubmitになる。

## 状態・JavaScript・キーボード

- 状態モデル: `native` — disabledや押下状態はネイティブ要素が担い、controlled状態APIはない。
- Stimulus: 不要
- browser API: HTML button element
- keyboard: EnterまたはSpaceでbuttonを実行する。 / リンクはEnterで移動する。
- CIで確認する操作: `form`、`keyboard`、`pointer`

## upstreamとの差異・未対応機能

### 差異

- asChildまたはrender propの代わりにtag引数で要素を差し替える。

### 未対応

- 明示的な未対応機能なし。

## CIで描画する代表例を含むpreview定義

`shadcn/button/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/button_preview.rb](../../spec/dummy/app/components/previews/shadcn/button_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

# Lookbookプレビュー(07-testing §7)。upstreamのdocsページに相当する全バリアントの一覧。
# 手動ビジュアル確認の場でありテストではない。
module Shadcn
  class ButtonPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Button.new) { "Button" }
    end

    def variants
      render(Shadcn::Button.new(variant: :secondary)) { "Secondary" }
    end

    def destructive
      render(Shadcn::Button.new(variant: :destructive)) { "Destructive" }
    end

    def outline
      render(Shadcn::Button.new(variant: :outline)) { "Outline" }
    end

    def ghost
      render(Shadcn::Button.new(variant: :ghost)) { "Ghost" }
    end

    def link
      render(Shadcn::Button.new(variant: :link)) { "Link" }
    end

    def sizes
      render(Shadcn::Button.new(size: :sm)) { "Small" }
    end

    def with_icon
      render(Shadcn::Button.new(size: :icon)) { "☑" }
    end

    def as_link
      render(Shadcn::Button.new(tag: :a, href: "#")) { "Link Button" }
    end
  end
end
```
