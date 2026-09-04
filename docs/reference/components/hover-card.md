# `hover-card` — `Shadcn::HoverCard`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/hover_card.rb#L7) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/hover_card_preview.rb)

hover intentとフォーカスで補足カードを遅延表示する、SSR済みの浮動コンテンツ。

## 構成

- 主コンポーネント: `Shadcn::HoverCard`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::HoverCard::Trigger`、`Shadcn::HoverCard::Content`
- このitemが公開する任意の補助クラス: なし

TriggerとContentを同じShadcn::HoverCard内へ1組置く。Triggerはhrefがあればa、なければbuttonになる。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::HoverCard`](../../../app/components/shadcn/hover_card.rb#L7) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `hover-card` |
| [`Shadcn::HoverCard::Trigger`](../../../app/components/shadcn/hover_card.rb#L15) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `hover-card-trigger` |
| [`Shadcn::HoverCard::Content`](../../../app/components/shadcn/hover_card.rb#L33) | `new(side: :bottom, align: :center, side_offset: 4, align_offset: 4, collision_padding: 5, **args)`<br>initializerはShadcn::FloatingPositionOptionsで定義 | side: top / right / bottom / left / inline-start / inline-end (default: :bottom)<br>align: start / center / end (default: :center)<br>side_offset: 有限の数値 (default: 4)<br>align_offset: 有限の数値 (default: 4)<br>collision_padding: 0以上の有限の数値 (default: 5) | `hover-card-portal`<br>`hover-card-content` |

## HTML attributesの適用先

- 既定: 各公開クラスが描く自身のdata-slot要素。
- HoverCard::Contentの利用者属性とclass:は内部のhover-card-contentへ渡り、外側にはhover-card-portalラッパーが加わる。
- Triggerはhrefの有無でa/buttonを選ぶが、button時のtypeは自動設定しない。
- TriggerとContentのaria-describedby/aria-expandedは自動接続しない。必要なARIA参照は利用者が属性として明示する。

## フォーム送信

- 種別: `none`
- HoverCard自体は送信値を持たない。hrefなしTriggerはbuttonなのでフォーム内では意図しないsubmitを避けるためtype=buttonを明示する。name/value/disabled、未選択・複数値の送信契約はない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — SSR時はhidden/closedで、mouseenter/focus後100msに開き、mouseleave/blur後150msに閉じる。Ruby側にcontrolled open値はない。
- Stimulus: `shadcn--hover-card`
- browser API: setTimeout()/clearTimeout() / CSSOM geometry for floating positioning
- keyboard: Tab等でTriggerへフォーカスすると開き、フォーカスが外れると閉じる。 / href付きTriggerのEnter操作はネイティブリンクとして維持される。
- CIで確認する操作: `keyboard`、`pointer`、`position`、`state`

## upstreamとの差異・未対応機能

### 差異

- React HoverCardではなく、hidden属性、固定hover intent時間、Stimulus配置で表示する。
- ContentのPortalはbodyへ搬送せずDOM内のラッパーとして描く。

### 未対応

- controlled open値、open変更コールバック、openDelay/closeDelayの公開設定。
- TriggerとContent間のARIA参照ID自動生成。

## CIで描画する代表例を含むpreview定義

`shadcn/hover_card/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/hover_card_preview.rb](../../../spec/dummy/app/components/previews/shadcn/hover_card_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class HoverCardPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::HoverCard.new) do
        safe_join([
          render(Shadcn::HoverCard::Trigger.new(href: "#")) { "@rails" },
          render(Shadcn::HoverCard::Content.new) do
            "Ruby on Rails — ホバーで表示されるカードです"
          end
        ])
      end
    end
  end
end
```
