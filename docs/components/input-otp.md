# `input-otp` — `Shadcn::InputOTP`

> このページはコード・registry・手書き仕様から生成されています。直接編集せず、[生成元](../component_reference/README.md)を更新して `bundle exec rake docs:generate` を実行してください。

[コンポーネント一覧](README.md) / [実装](../../app/components/shadcn/input_otp.rb#L7) / [代表preview](../../spec/dummy/app/components/previews/shadcn/input_otp_preview.rb)

1つの実inputを送信値の正本とし、各文字をSlotへ投影するワンタイムコード入力。

## 構成

- 主コンポーネント: `Shadcn::InputOTP`
- 主コンポーネントと組み合わせる、常に必須のクラス: なし
- このitemが公開する任意の補助クラス: `Shadcn::InputOTP::Group`、`Shadcn::InputOTP::Slot`、`Shadcn::InputOTP::Separator`

ブロックを省略するとlength個のSlotを1つのGroupへ自動生成する。明示構成ではGroup、index:付きSlot、任意のSeparatorをブロック内へ置く。

## Ruby APIとslot

`**args` の共通規則（`tag:`、`class:`、HTML属性）は[一覧ページ](README.md#共通のhtml属性)を参照してください。
下表の`upstream data-slot`は見た目の契約に使うDOM識別子です。必須・任意の子構成は上の「構成」を正本とし、Rubyがフォーム送信等のために追加する内部要素は「HTML attributesの適用先」と「upstreamとの差異」に記載します。

| class | initializer | 既定値・許容値 | upstream data-slot |
|---|---|---|---|
| [`Shadcn::InputOTP`](../../app/components/shadcn/input_otp.rb#L7) | `new(length: self.class.property_default(:length), value: nil, container_class: nil, **args)` | length: number, integer, >= 1 (default: 6) | `input-otp` |
| [`Shadcn::InputOTP::Group`](../../app/components/shadcn/input_otp.rb#L188) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `input-otp-group` |
| [`Shadcn::InputOTP::Slot`](../../app/components/shadcn/input_otp.rb#L192) | `new(index:, **args)` | index: number, integer, >= 0 | `input-otp-slot` |
| [`Shadcn::InputOTP::Separator`](../../app/components/shadcn/input_otp.rb#L241) | `new(**args)`<br>initializerはShadcn::BaseComponentで定義 | 追加制約なし（signatureどおり） | `input-otp-separator` |

## HTML attributesの適用先

- 既定: オーバーレイされた実input[data-slot=input-otp]。
- container_class:だけはdata-slotを持たない外側containerへ適用する。
- ブロック内容はaria-hiddenの装飾displayへ入り、フォーム属性やARIAを所有しない。
- typeは常にtext、maxlengthはlength、inputmodeの既定はnumeric、autocompleteの既定はone-time-codeとなる。
- valueはlengthで切り詰めて実inputとSSR Slotの両方へ反映する。

## フォーム送信

- 種別: `composite`
- 実inputだけがname/value/disabled/required/formを所有する。name付きで有効なら空文字もname=として送信し、disabledなら省略する。単一文字列のみでmultiple送信は行わず、SlotやSeparatorは値を送信しない。

## 状態・JavaScript・キーボード

- 状態モデル: `uncontrolled` — value:はSSR初期値で、接続後は実input.valueとselectionが唯一の正本。StimulusはSlot、caret、disabled/invalid表示へ投影し、Ruby側にcontrolled value更新や変更コールバックはない。
- Stimulus: `shadcn--input-otp`
- browser API: HTMLInputElement selectionStart/selectionEnd/setSelectionRange() / InputEvent and composition events / ClipboardEvent paste data / Native form reset and constraint validation
- keyboard: 文字入力、削除、選択、貼り付けは透明な実inputで行う。 / 満杯時のcaret/selectionを正規化し、次の入力で選択中の桁を置換できる。
- CIで確認する操作: `accessibility`、`form`、`keyboard`、`no_js`、`pointer`、`state`

## upstreamとの差異・未対応機能

### 差異

- input-otp 1.4.2相当の実input/装飾Slot構造をSSRし、Stimulusで同期する。
- patternは独自numericモードではなく、利用者指定のJavaScript RegExpとして受理・拒否に使う。
- JavaScript無効時はnoscript CSSで実inputを通常のテキスト欄として表示する。

### 未対応

- controlled value/onChange/onComplete API。
- pasteTransformer、password-manager badge制御、カスタムrender callback。

## CIで描画する代表例を含むpreview定義

`shadcn/input_otp/default` は [Lookbook request spec](../../spec/requests/lookbook_previews_spec.rb) がHTTP描画します。以下はそのexampleを含む [spec/dummy/app/components/previews/shadcn/input_otp_preview.rb](../../spec/dummy/app/components/previews/shadcn/input_otp_preview.rb) の全定義です。同じファイルにある他のexampleも同specが描画します。

```ruby
# frozen_string_literal: true

module Shadcn
  # Previewはdummyアプリの標準inflectorで読み込まれるため、OTP acronymを要求しない定数名にする。
  class InputOtpPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::InputOTP.new(length: 6, value: "12", aria: { label: "認証コード" }))
    end
  end
end
```
