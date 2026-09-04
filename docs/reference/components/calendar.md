# `calendar` — `Shadcn::Calendar`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/calendar.rb#L13) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/calendar_preview.rb)

一か月分の日付gridと前後月ナビゲーションをSSRする。

## 構成

- 主コンポーネント: `Shadcn::Calendar`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: `Shadcn::Calendar::DayButton`

Navigation、DayButton、月gridはrootが内部生成する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Calendar`](../../../app/components/shadcn/calendar.rb#L13) | `new(month: Date.current.beginning_of_month, selected: nil, month_path: nil, **args)` | 追加制約なし（signatureどおり） | `calendar` |
| [`Shadcn::Calendar::DayButton`](../../../app/components/shadcn/calendar.rb#L115) | `new(date: Date.current, selected: false, outside: false, today: false, **args)` | 追加制約なし（signatureどおり） | `calendar-day-button` |

## HTML attributesの適用先

- 既定: Shadcn::Calendar
- month、selected、month_pathはrootのRuby引数でありHTML属性ではない。
- 月表はrole=grid/aria-labelledby、日付cellはrole=gridcell/aria-selected、日付buttonは日付のaria-labelを持つ。

## フォーム送信

- 種別: `none`
- 日付はtype=buttonでフォーム値を送信しない。月移動はフォームcontrolではなくmonth_pathへのGETリンクを使う。

## 状態・JavaScript・キーボード

- 状態モデル: `server` — 表示月と選択日はサーバ入力が正本で、Stimulusは現在の月grid内のフォーカスだけをuncontrolledに移動する。
- Stimulus: `shadcn--calendar`
- browser API: HTML table grid / HTML links
- keyboard: 矢印キーで表示中の42日間を移動する。 / HomeとEndで週の端へ移動する。 / 前後月リンクはTabで移動しEnterで実行する。
- CIで確認する操作: `keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- react-day-pickerを使わず日曜始まりの月表をRubyで生成し、月移動はGETラウンドトリップにする。

### 未対応

- 範囲選択、複数選択、複数月表示、upstreamの高度なday-picker設定。

## CIで描画する代表例を含むpreview定義

`shadcn/calendar/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/calendar_preview.rb](../../../spec/dummy/app/components/previews/shadcn/calendar_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class CalendarPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Calendar.new(month: Date.new(2026, 8, 1), selected: Date.new(2026, 8, 27)))
    end

    def plain
      render(Shadcn::Calendar.new(month: Date.new(2026, 8, 1)))
    end
  end
end
```
