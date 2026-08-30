# `tabs` — `Shadcn::Tabs`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/tabs.rb#L8) / [代表preview](../../spec/dummy/app/components/previews/shadcn/tabs_preview.rb)

ARIA tabsパターンとroving tabindexで関連パネルを切り替える。

## 構成

- 主コンポーネント: `Shadcn::Tabs`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Tabs::List`、`Shadcn::Tabs::Trigger`、`Shadcn::Tabs::Content`
- このitemが公開する任意の補助クラス: なし

各TriggerとContentは同じ非空valueで対応付ける。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Tabs`](../../app/components/shadcn/tabs.rb#L8) | `new(orientation: self.class.property_default(:orientation), **args)` | orientation: horizontal, vertical (default: "horizontal") | `tabs` |
| [`Shadcn::Tabs::List`](../../app/components/shadcn/tabs.rb#L26) | `new(variant: ShadcnViewComponents::Contracts::Tabs::List::DEFAULTS.fetch(:variant), **args)` | variant: default, line (default: default) | `tabs-list` |
| [`Shadcn::Tabs::Trigger`](../../app/components/shadcn/tabs.rb#L52) | `new(value:, active: false, **args)` | 追加制約なし（signatureどおり） | `tabs-trigger` |
| [`Shadcn::Tabs::Content`](../../app/components/shadcn/tabs.rb#L100) | `new(value:, **args)` | 追加制約なし（signatureどおり） | `tabs-content` |

## HTML attributesの適用先

- 既定: root、List、Trigger、Contentそれぞれが描画する要素。
- Triggerはbuttonが既定でrole=tab、aria-selected、tabindexを持つ。tag=aならtypeは追加しない。
- Contentはrole=tabpanelを持つ。

## フォーム送信

- 種別: `none`
- button Triggerはtype=buttonでフォームを送信しない。name/value/disabledや送信値は管理せず、disabledを付けたTriggerは操作対象外になる。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — activeはSSR初期状態で、接続後はStimulusが選択、tabindex、パネル表示を管理する。外部controlled valueはない。
- Stimulus: `shadcn--tabs`
- browser API: ARIA tabs semantics / focus management
- keyboard: 方向に応じたArrowキーで隣のtabへ移動・選択する。 / Home/Endで先頭・末尾へ移動する。 / Enter/Spaceとclickで選択する。
- CIで確認する操作: `accessibility`、`keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- React tabs primitiveのcontextではなくdata-valueとStimulusで選択を管理する。

### 未対応

- 外部controlled value/onValueChange。

## CIで描画する代表例を含むpreview定義

`shadcn/tabs/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/tabs_preview.rb](../../spec/dummy/app/components/previews/shadcn/tabs_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class TabsPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Tabs.new) do
        safe_join([
                    render(Shadcn::Tabs::List.new) do
                      safe_join([
                                  render(Shadcn::Tabs::Trigger.new(value: "account", active: true)) { "アカウント" },
                                  render(Shadcn::Tabs::Trigger.new(value: "password")) { "パスワード" }
                                ])
                    end,
                    render(Shadcn::Tabs::Content.new(value: "account")) { "アカウント設定の内容" },
                    render(Shadcn::Tabs::Content.new(value: "password")) { "パスワード変更の内容" }
                  ])
      end
    end

    def line
      render(Shadcn::Tabs.new) do
        safe_join([
                    render(Shadcn::Tabs::List.new(variant: :line)) do
                      safe_join([
                                  render(Shadcn::Tabs::Trigger.new(value: "a", active: true)) { "概要" },
                                  render(Shadcn::Tabs::Trigger.new(value: "b")) { "設定" }
                                ])
                    end,
                    render(Shadcn::Tabs::Content.new(value: "a")) { "概要の内容" },
                    render(Shadcn::Tabs::Content.new(value: "b")) { "設定の内容" }
                  ])
      end
    end

    def vertical
      render(Shadcn::Tabs.new(orientation: :vertical)) do
        safe_join([
                    render(Shadcn::Tabs::List.new) do
                      safe_join([
                                  render(Shadcn::Tabs::Trigger.new(value: "account", active: true)) { "アカウント" },
                                  render(Shadcn::Tabs::Trigger.new(value: "password")) { "パスワード" }
                                ])
                    end,
                    render(Shadcn::Tabs::Content.new(value: "account")) { "アカウント設定の内容" },
                    render(Shadcn::Tabs::Content.new(value: "password")) { "パスワード変更の内容" }
                  ])
      end
    end
  end
end
```
