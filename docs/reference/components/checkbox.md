# `checkbox` — `Shadcn::Checkbox`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/checkbox.rb#L5) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/checkbox_preview.rb)

ネイティブinputを状態の正本にするチェックボックス。

## 構成

- 主コンポーネント: `Shadcn::Checkbox`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: なし

indicatorはrootが装飾要素として内部生成する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Checkbox`](../../../app/components/shadcn/checkbox.rb#L5) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `checkbox`<br>`checkbox-indicator` |

## HTML attributesの適用先

- 既定: Shadcn::Checkbox
- 利用者のARIA属性は実inputへ渡り、表示用indicatorはaria-hiddenになる。ラベルはidと外部labelのforで接続する。

## フォーム送信

- 種別: `native`
- name/value/disabled/form/requiredはinputへ渡る。checkedならvalue（省略時on）を一件送信し、未選択またはdisabledなら送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `native` — checkedが唯一の状態源でuncontrolledに変化し、Stimulusはdata-checked/data-uncheckedだけを同期する。programmatic変更はchangeイベントが必要。
- Stimulus: `shadcn--checked-state`
- browser API: HTML checkbox input / form reset
- keyboard: Spaceで選択を切り替える。
- CIで確認する操作: `accessibility`、`form`、`keyboard`、`no_js`、`pointer`、`reconnect`、`reset`、`state`

## upstreamとの差異・未対応機能

### 差異

- Base UI Checkbox primitiveの代わりにinput type=checkboxとCSS peer indicatorを使う。

### 未対応

- indeterminate状態の専用API、controlled checkedとonCheckedChange。

## CIで描画する代表例を含むpreview定義

`shadcn/checkbox/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/checkbox_preview.rb](../../../spec/dummy/app/components/previews/shadcn/checkbox_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class CheckboxPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Checkbox.new(id: "check", name: "check", aria: { label: "通知を受け取る" }))
    end

    def checked
      render(Shadcn::Checkbox.new(checked: true, aria: { label: "選択済み" }))
    end

    def unchecked
      render(Shadcn::Checkbox.new(checked: false, aria: { label: "未選択" }))
    end

    def disabled
      render(Shadcn::Checkbox.new(disabled: true))
    end
  end
end
```
