# `field` — `Shadcn::Field`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/field.rb#L8) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/field_preview.rb)

ラベル、説明、エラー、fieldset等を組み立てるフォームフィールド用レイアウト。

## 構成

- 主コンポーネント: `Shadcn::Field`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: `Shadcn::Field::Content`、`Shadcn::Field::Description`、`Shadcn::Field::Error`、`Shadcn::Field::Group`、`Shadcn::Field::Label`、`Shadcn::Field::Legend`、`Shadcn::Field::Separator`、`Shadcn::Field::Set`、`Shadcn::Field::Title`

用途に応じてField::Labelと実フォームコントロール、Description/Errorを同じFieldへ置く。複数項目の集合にはGroupまたはSet/Legendを使うが、固定の子構成は強制しない。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Field`](../../../app/components/shadcn/field.rb#L8) | `new(orientation: ShadcnViewComponents::Contracts::Field::DEFAULTS.fetch(:orientation), **args)` | orientation: horizontal, responsive, vertical (default: vertical) | `field` |
| [`Shadcn::Field::Content`](../../../app/components/shadcn/field.rb#L28) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `field-content` |
| [`Shadcn::Field::Description`](../../../app/components/shadcn/field.rb#L32) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `field-description` |
| [`Shadcn::Field::Error`](../../../app/components/shadcn/field.rb#L39) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `field-error` |
| [`Shadcn::Field::Group`](../../../app/components/shadcn/field.rb#L53) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `field-group` |
| [`Shadcn::Field::Label`](../../../app/components/shadcn/field.rb#L57) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `field-label` |
| [`Shadcn::Field::Legend`](../../../app/components/shadcn/field.rb#L75) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `field-legend` |
| [`Shadcn::Field::Separator`](../../../app/components/shadcn/field.rb#L82) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `field-separator`<br>`field-separator-content` |
| [`Shadcn::Field::Set`](../../../app/components/shadcn/field.rb#L94) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `field-set` |
| [`Shadcn::Field::Title`](../../../app/components/shadcn/field.rb#L102) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `field-label` |

## HTML attributesの適用先

- 既定: 各公開クラスが描く自身のdata-slot要素。
- Fieldのorientation:はdata-orientationと契約クラスへ反映される。
- Field::Labelはlabel契約のクラスも合成し、for:をネイティブlabelへ渡す。
- Field::Separatorは内側にfield-separator-content spanを生成する。
- Field::Errorは本文が空なら要素自体を描画しない。
- Labelのforとcontrolのid、Description/Errorのidとcontrolのaria-describedby/aria-invalidは利用者が明示接続する。

## フォーム送信

- 種別: `container`
- Field自身はname/valueを送信しない。name/value/disabled、未入力値、複数値の送信は内側の実input/select等が所有する。Field::Setのdisabled等はネイティブfieldset属性として子コントロールへ作用し得る。

## 状態・JavaScript・キーボード

- 状態モデル: `server` — orientationとError本文はサーバー描画で決まる。入力値のcontrolled/uncontrolled境界は内側のフォームコントロールが所有し、Fieldは同期しない。
- Stimulus: 不要
- browser API: Native label/control association / HTMLFieldSetElement and HTMLLegendElement semantics
- keyboard: コンポーネント固有操作なし
- CIで確認する操作: 対象外 — This component has no independent browser interaction beyond render and visual coverage.

## upstreamとの差異・未対応機能

### 差異

- ReactのFieldプリミティブを、Rails側でラベルとコントロールを明示接続するViewComponent群として提供する。
- Field::Errorは文字列本文だけを扱い、配列エラーはForm::Errorへ分離した。

### 未対応

- Field::Errorへerrors配列を渡すupstreamの複数エラー描画。
- render prop/asChildによる要素合成。

## CIで描画する代表例を含むpreview定義

`shadcn/field/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/field_preview.rb](../../../spec/dummy/app/components/previews/shadcn/field_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class FieldPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Field::Group.new) do
        safe_join([email_field, name_field])
      end
    end

    def horizontal
      render(Shadcn::Field.new(orientation: :horizontal)) do
        safe_join([publish_content, render(Shadcn::Switch.new)])
      end
    end

    private

    def email_field
      render(Shadcn::Field.new) do
        safe_join([
                    render(Shadcn::Field::Label.new(for: "field-email")) { "メールアドレス" },
                    render(Shadcn::Input.new(id: "field-email", type: "email", placeholder: "you@example.com")),
                    render(Shadcn::Field::Description.new) { "ログインに使うアドレスです" }
                  ])
      end
    end

    def name_field
      render(Shadcn::Field.new) do
        safe_join([
                    render(Shadcn::Field::Label.new(for: "field-name")) { "名前" },
                    render(Shadcn::Input.new(id: "field-name")),
                    render(Shadcn::Field::Description.new) { "表示名として使われます" }
                  ])
      end
    end

    def publish_content
      render(Shadcn::Field::Content.new) do
        safe_join([
                    render(Shadcn::Field::Title.new) { "公開する" },
                    render(Shadcn::Field::Description.new) { "プロフィールを全員に表示します" }
                  ])
      end
    end
  end
end
```
