# `form` — `Shadcn::Form::Item`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component-specifications/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../../app/components/shadcn/form.rb#L29) / [代表preview](../../../spec/dummy/app/components/previews/shadcn/form_preview.rb)

Field契約の上に、invalid状態とRailsのエラー配列表示を加えるフォーム統合部品。

## 構成

- 主コンポーネント: `Shadcn::Form::Item`
- 主コンポーネントと組み合わせる、常に必須のクラス: `Shadcn::Field::Label`
- このitemが公開する任意の補助クラス: `Shadcn::Form::Error`

Shadcn::Formは名前空間で描画ルートを持たない。Form::Itemの中へField::Label、実フォームコントロール、任意のField::Description、Form::Errorを明示的に置く。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::Form::Item`](../../../app/components/shadcn/form.rb#L29) | `new(invalid: false, orientation: ShadcnViewComponents::Contracts::Form::Item::DEFAULTS.fetch(:orientation), **args)` | orientation: horizontal, responsive, vertical (default: vertical) | `field` |
| [`Shadcn::Form::Error`](../../../app/components/shadcn/form.rb#L58) | `new(message: nil, errors: nil, **args)` | 追加制約なし（signatureどおり） | `field-error` |

## HTML attributesの適用先

- 既定: Form::ItemまたはForm::Errorが描く自身のdata-slot要素。
- Form::Itemのinvalid:とorientation:はdata-invalid/data-orientationおよび契約クラスへ反映される。
- Form::Errorはブロック本文を最優先し、message:/errors:を重複除去して1件は平文、複数件はulとして描く。空なら非描画。

## フォーム送信

- 種別: `container`
- form要素や成功コントロールは生成せず、Form::Item/Errorにname/value/disabledや送信値はない。未入力・複数値を含む送信は内側の実コントロールが所有する。

## 状態・JavaScript・キーボード

- 状態モデル: `server` — invalid、orientation、エラーメッセージはサーバーが描画する。入力値のcontrolled/uncontrolled状態やaria-invalid/aria-describedbyの接続は利用者が実コントロール側で明示する。
- Stimulus: 不要
- browser API: Native form submission and constraint validation of nested controls
- keyboard: 内側に置いた実フォームコントロールと送信buttonのネイティブ操作に従う。
- CIで確認する操作: `accessibility`、`form`、`keyboard`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- base-novaにform registry itemはなく、本項目はupstream docs/formsのField構成をRails向けにしたlocal override。
- React context/useFormFieldを使わず、id、for、aria-invalid、aria-describedbyを利用者が明示接続する。

### 未対応

- useFormField相当の暗黙なラベル・説明・エラーID接続。
- フォームモデルやバリデーションライブラリとの自動バインド。

## CIで描画する代表例を含むpreview定義

`shadcn/form/default` は [Lookbook request spec](../../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/form_preview.rb](../../../spec/dummy/app/components/previews/shadcn/form_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  class FormPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Form::Item.new(invalid: true)) do
        safe_join([
                    render(Shadcn::Field::Label.new(for: "preview-email")) { "メールアドレス" },
                    render(Shadcn::Input.new(id: "preview-email", type: "email", placeholder: "you@example.com", aria: { invalid: true })),
                    render(Shadcn::Field::Description.new) { "ログインに使うアドレスです" },
                    render(Shadcn::Form::Error.new(errors: ["メールアドレスを入力してください"]))
                  ])
      end
    end

    def without_error
      render(Shadcn::Form::Item.new) do
        safe_join([
                    render(Shadcn::Field::Label.new(for: "preview-name")) { "名前" },
                    render(Shadcn::Input.new(id: "preview-name")),
                    render(Shadcn::Field::Description.new) { "エラーが無いときはError要素自体が描かれません" },
                    render(Shadcn::Form::Error.new)
                  ])
      end
    end
  end
end
```
