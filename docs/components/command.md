# `command` — `Shadcn::Command`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/command.rb#L8) / [代表preview](../../spec/dummy/app/components/previews/shadcn/command_preview.rb)

入力文字列でコマンド項目を絞り込むリスト。

## 構成

- 主コンポーネント: `Shadcn::Command`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Command::Input`、`Shadcn::Command::List`、`Shadcn::Command::Item`
- このitemが公開する任意の補助クラス: `Shadcn::Command::Dialog`、`Shadcn::Command::Empty`、`Shadcn::Command::Group`、`Shadcn::Command::Separator`、`Shadcn::Command::Shortcut`

Empty、Group、Separator、Shortcutは内容に応じて追加し、Dialog版はShadcn::Command::Dialogを使う。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Command`](../../app/components/shadcn/command.rb#L8) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `command` |
| [`Shadcn::Command::Dialog`](../../app/components/shadcn/command.rb#L17) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | なし |
| [`Shadcn::Command::Input`](../../app/components/shadcn/command.rb#L32) | `new(placeholder: nil, **args)` | 追加制約なし（signatureどおり） | `command-input-wrapper`<br>`command-input` |
| [`Shadcn::Command::List`](../../app/components/shadcn/command.rb#L108) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `command-list` |
| [`Shadcn::Command::Empty`](../../app/components/shadcn/command.rb#L112) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `command-empty` |
| [`Shadcn::Command::Group`](../../app/components/shadcn/command.rb#L120) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `command-group` |
| [`Shadcn::Command::Item`](../../app/components/shadcn/command.rb#L124) | `new(value: nil, **args)` | 追加制約なし（signatureどおり） | `command-item` |
| [`Shadcn::Command::Separator`](../../app/components/shadcn/command.rb#L141) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `command-separator` |
| [`Shadcn::Command::Shortcut`](../../app/components/shadcn/command.rb#L145) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `command-shortcut` |

## HTML attributesの適用先

- 既定: Shadcn::Command
- placeholder等はInputへ、検索対象値はItemのvalueへ渡す。
- 検索inputはaria-label=コマンド検索、Itemはrole=optionとdata-selectedを持つ。

## フォーム送信

- 種別: `none`
- 検索inputはフォーム送信用nameを既定で持たず、Itemも値を送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — query、可視項目、選択候補はStimulusがDOM上で管理し、controlled filter/value APIはない。
- Stimulus: `shadcn--command`
- browser API: 追加要件なし
- keyboard: 上下矢印で可視Itemを移動する。 / HomeとEndで端へ移動する。 / Enterで選択イベントを発火する。
- CIで確認する操作: `keyboard`、`state`

## upstreamとの差異・未対応機能

### 差異

- cmdkを使わずSSR済み項目をStimulusで絞り込み、Dialog版は本gemのDialogを合成する。

### 未対応

- 独自filter関数、score、controlled value、非同期候補管理、listbox/aria-activedescendantによるactive item参照。

## CIで描画する代表例を含むpreview定義

`shadcn/command/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/command_preview.rb](../../spec/dummy/app/components/previews/shadcn/command_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class CommandPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Command.new(class: "rounded-lg border shadow-md")) do
        safe_join([
          render(Shadcn::Command::Input.new(placeholder: "コマンドを検索…")),
          render(Shadcn::Command::List.new) do
            safe_join([
              render(Shadcn::Command::Empty.new) { "結果が見つかりません" },
              render(Shadcn::Command::Group.new) do
                safe_join([
                  render(Shadcn::Command::Item.new(value: "copy")) do
                    safe_join(["コピー", render(Shadcn::Command::Shortcut.new) { "⌘C" }])
                  end,
                  render(Shadcn::Command::Item.new(value: "paste")) do
                    safe_join(["貼り付け", render(Shadcn::Command::Shortcut.new) { "⌘V" }])
                  end
                ])
              end
            ])
          end
        ])
      end
    end
  end
end
```
