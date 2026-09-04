# `native-select` — `Shadcn::NativeSelect`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/native_select.rb#L8) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/native_select_preview.rb)

実select/optgroup/optionを使い、JavaScriptなしで選択・検証・送信できる装飾select。

## 構成

- 主コンポーネント: `Shadcn::NativeSelect`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::NativeSelect::Option`
- このitemが公開する任意の補助クラス: `Shadcn::NativeSelect::OptGroup`

Optionを直接置くか、必要に応じてOptGroupでまとめる。外側wrapperとchevron iconはNativeSelectが自動生成する。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::NativeSelect`](../../../app/components/shadcn/native_select.rb#L8) | `new(size: self.class.property_default(:size), **args)` | size: default, sm (default: "default") | `native-select-wrapper`<br>`native-select`<br>`native-select-icon` |
| [`Shadcn::NativeSelect::OptGroup`](../../../app/components/shadcn/native_select.rb#L57) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `native-select-optgroup` |
| [`Shadcn::NativeSelect::Option`](../../../app/components/shadcn/native_select.rb#L65) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `native-select-option` |

## HTML attributesの適用先

- 既定: 実際のselect[data-slot=native-select]。
- class:は外側native-select-wrapperへ適用される。
- size:は装飾variantとしてwrapper/selectのdata-sizeへ反映され、HTMLSelectElement.size属性としては出力されない。
- OptGroup/Optionへ渡した属性はそれぞれ実optgroup/optionへ適用される。

## フォーム送信

- 種別: `native`
- 実selectがname/value/disabled/required/form/multipleを所有する。単一選択は選択optionの値を1件送信し、multipleは同じnameで選択値を複数送信する（Railsではname末尾[]を推奨）。multipleで未選択なら項目自体を送信せず、disabled selectも省略する。初期選択はOptionのselected属性で指定する。

## 状態・JavaScript・キーボード

- 状態モデル: `native` — 選択状態、フォーカス、制約検証はHTMLSelectElementが所有する。Rubyは専用のcontrolled value/default_value APIを持たず、SSR後の選択変更を同期しない。
- Stimulus: 不要
- browser API: HTMLSelectElement / Native constraint validation and form submission
- keyboard: 矢印、Home/End、文字typeahead等はプラットフォームのネイティブselect操作に従う。 / 関連付けたlabelの作動でselectへフォーカスする。
- CIで確認する操作: `accessibility`、`form`、`keyboard`、`no_js`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- ReactのNativeSelect構造を、実selectとサーバー描画Option/OptGroupとして提供する。
- 利用者classはupstream同様wrapperへ、フォーム/ARIA属性は実selectへ分離する。

### 未対応

- 専用のcontrolled value/onValueChange API。

## CIで描画する代表例を含むpreview定義

`shadcn/native_select/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/native_select_preview.rb](../../../spec/dummy/app/components/previews/shadcn/native_select_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class NativeSelectPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::NativeSelect.new(name: "fruit", aria: { label: "果物" })) do
        safe_join([
                    render(Shadcn::NativeSelect::Option.new(value: "apple")) { "りんご" },
                    render(Shadcn::NativeSelect::Option.new(value: "banana")) { "バナナ" }
                  ])
      end
    end
  end
end
```
