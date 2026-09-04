# 04 — コンポーネント規約（命名・API・slots）

- ステータス: **Current**（現行実装の保守者向け設計資料）
- 対象読者: コンポーネント実装者・本ライブラリの利用者
- 関連ドキュメント: [01-architecture](architecture.md) / [03-extraction-codegen](extraction-codegen.md) / [05-stimulus-hotwire](stimulus-hotwire.md) / [08-sorbet](sorbet.md)

---

## 1. 設計思想

APIは **「upstreamのReact APIを機械的規則でRubyに写像したもの」** とする。
独自の創意工夫を加えない。理由:

- 利用者がshadcn/uiのドキュメント・エコシステム（例・テーマ・議論）をそのまま参照できる
- upstreamのAPI変更を「規約の変更」に還元でき、追従時の判断が機械的になる
- 規約自体が契約（[03](extraction-codegen.md)）と並ぶ第二の契約として、ドキュメントと実装の乖離を防ぐ

## 2. 命名規約

| 対象 | 規約 | 例 |
|---|---|---|
| ルートコンポーネント | `Shadcn::<PascalCase>` | `Shadcn::Button` / `Shadcn::Alert` / `Shadcn::AlertDialog` |
| 複合コンポーネントの部位 | 親クラスのネストされた定数 | `Shadcn::Card::Header` / `Shadcn::Card::Title` / `Shadcn::Card::Content` / `Shadcn::Card::Footer` |
| Dialog等のパーツ分割 | 同上 | `Shadcn::Dialog::Header` / `Shadcn::Dialog::Title` / `Shadcn::Dialog::Footer` |
| 基底クラス | `Shadcn::BaseComponent`（private扱い。利用者が直接参照しない） | — |
| Stimulusコントローラ | `shadcn/<component>_controller.js`、data-controller名 `shadcn--<component>` | [05](stimulus-hotwire.md) §2 |
| 契約モジュール | `ShadcnViewComponents::Contracts::<PascalCase>`（生成物） | [03](extraction-codegen.md) §6.1 |

- upstreamのエクスポート名（`CardHeader` → `Card::Header`）からの変換は命名表で機械定義する。
  変換が非自明なもの（例: `AlertDialog` が1語か2語か）は `tools/extractor/config/names.json` に明示的に列挙し、
  生成物の `component_class` フィールドに焼き付ける
- **erbsorbetは使わない**。ERBはロジックを持たない程度に薄く保ち、型検査対象はRubyコードに集中させる（[08-sorbet](sorbet.md) §4）

## 3. upstream prop → Ruby API 対応規約

### 3.1 基本則

| upstream (React) | 本ライブラリ (Ruby) | 備考 |
|---|---|---|
| `variant="outline"` | `variant: :outline` | シンボル。文字列も受け入れる（正規化して比較） |
| `size="sm"` | `size: :sm` | 同上 |
| `className="extra"` | `class: "extra"` | Rails流の属性名。`tailwind_merge` で契約クラスと統合 |
| `asChild` | **提供しない** | asChildはSlotによるレンダリング差し替え。代替は §3.3 の `tag:` / content渡し |
| `disabled` / `type` 等のHTML属性 | 同名kwargs (`disabled:, type:`) | 属性パススルーへ |
| `onXxx`（イベントハンドラ） | **提供しない** | サーバーサイドコンポーネントに意味がない。ふるまいはStimulus/リンクで表現 |
| `forceMount` 等の制御props | それぞれ個別設計 | [05](stimulus-hotwire.md) でコンポーネント毎に定義 |
| children（テキスト/要素） | ブロック or スロット | §4 |
| `defaultValue` / `value` / `onChange` | `default_*` / HTML属性直書き or Stimulus value | コンポーネント毎に「サーバー状態由来かJS状態か」で判断 |

### 3.2 引数の形式

```ruby
# 初期化シグネチャの標準形（typed: strict）
sig do
  params(
    variant: T.any(Symbol, String),
    size: T.any(Symbol, String),
    args: T::Hash[Symbol, T.untyped]   # **args: HTML属性パススルー
  ).void
end
def initialize(variant: :default, size: :default, **args)
```

- 省略時の既定値は**契約の `defaults` から読む**（リテラルで二重管理しない）:
  `variant: Contracts::Button::DEFAULTS.fetch(:variant)`
- **kwargsを増やさない**: upstreamに存在するpropのみ。Rails慣行向けの独自propは
  明確な必要性がある場合のみ、決定ログを更新してから追加する

### 3.3 ポリモルフィック要素（asChildの代替）

upstreamで `asChild` を使う場面（Buttonの中にLinkを入れたい等）は、次のいずれかで表現する:

1. **`tag:` オプション**（BaseComponentが提供）: `Shadcn::Button.new(tag: :a, href: "/x")`
   — 同じクラス・スロット構造で要素名だけ変える。`data-slot` は維持される
2. **`render_in` / contentとして任意のレンダリング**:
   `render Shadcn::Button::Variants.new(variant: :link) { link_to "..." }` のような
   クラスのみを提供するヘルパ（`Shadcn::Button.classes(variant:, size:)` モジュール関数）
   — 利用者が自分の要素にクラスだけ適用したい場合の抜け道

どちらも適合試験の対象外にはしない: `tag:` 差し替え時もクラス列は契約と一致することを検証する。

## 4. slots（`data-slot` ↔ ViewComponent slot）

upstreamの `data-slot` は本ライブラリでは **(a) 出力するHTMLの属性（契約）** かつ
**(b) ViewComponent slots の対応表** として扱う。

### 4.1 対応パターン

| upstreamの形 | 本ライブラリの形 |
|---|---|
| 単一エクスポート・単一要素（Button, Badge） | ブロックがコンテンツ。slot定義なし |
| 複合（Card: Card + CardHeader + CardTitle + CardDescription + CardContent + CardFooter） | `Shadcn::Card`（ルート）+ ネストクラスを並べて使う **組み合わせスタイル**（下例） |
| 条件付きサブ要素（Avatarのimage/fallback） | `renders_one :image` / `renders_one :fallback` |
| リスト（TabsのTrigger群） | `renders_many :triggers` または ネストクラスの繰り返し |

```erb
<%# 組み合わせスタイルの例（upstreamのJSXに近い見た目を保つ） %>
<%= render Shadcn::Card.new do |card| %>
  <%= render Shadcn::Card::Header.new do %>
    <%= render Shadcn::Card::Title.new { "タイトル" } %>
    <%= render Shadcn::Card::Description.new { "説明" } %>
  <% end %>
  <%= render Shadcn::Card::Content.new do %>
    本文
  <% end %>
<% end %>
```

- **柔軟slot（`renders_one :header` をCard自身に持たせる方式）は原則使わない**。
  組み合わせスタイルは「どのネストクラスがどのdata-slotを持つか」を1:1に保ち、
  契約（スロット一覧）との機械的対応を可能にするためである
- ネストクラスは親クラスのファイルに同居させる（`app/components/shadcn/card.rb` に
  `Card`, `Card::Header`, `Card::Title`, ... を定義）。1ファイル=1upstreamアイテムという
  対応を保ち、ファイル数の膨張と命名表の乖離を防ぐ

### 4.2 data-slotの出力規則

- ルート要素および契約に列挙された要素は**必ず** `data-slot` を出力する
  （JSセレクタ・適合試験の両方のアンカーであるため、省略不可）
- 独自の追加slot（本ライブラリ独自の構造）には `data-slot` を**付けない**
  （契約に存在しないスロットであることが自明になるように）

## 5. クラス解決とERBテンプレート

ERBテンプレートはクラス文字列を持たない。すべて `Classes` ヘルパ経由:

```erb
<%# app/components/shadcn/button.erb（イメージ） %>
<%= content_tag tag, **html_attributes.merge(
      class: ShadcnViewComponents::Classes.resolve(:button, variant: variant, size: size, extra: class),
      data: { slot: Contracts::Button::ROOT_SLOT }
    ) do %>...
```

```ruby
# app/components/shadcn/button.rb（全体像は §7 テンプレート参照）
module Shadcn
  class Button < BaseComponent
    sig { params(variant: T.any(Symbol, String), size: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void }
    def initialize(variant: Contracts::Button::DEFAULTS.fetch(:variant),
                   size: Contracts::Button::DEFAULTS.fetch(:size), **args)
      @variant = normalize_option(:button, :variant, variant)
      @size = normalize_option(:button, :size, size)
      super(**args)
    end
  end
end
```

- `normalize_option` はBaseComponent提供。`String#to_sym` 正規化と、
  契約に存在しない値の `ArgumentError`（fail-fast）を担う
- 動的な装飾（状態クラス `data-[state]:...` 等）でどうしても文字列を書く必要がある場合、
  そのコンポーネントファイル内に閉じ、**クラス定義（バリアント表）は絶対に書かない**

## 6. HTML属性のマージ規則

BaseComponentが担う共通ふるまい:

1. `class:` は契約クラスとの**tailwind_merge統合**（`tailwind_merge` gem）。利用者の上書きを後勝ちで反映
2. `data:` ハッシュは深部マージ。`data: { controller: "x" }` と契約由来の `data: { slot: ... }` が共存する
3. `aria:` は同様にマージ。利用者指定を優先
4. それ以外の属性（`type:`, `href:`, `id:`, `name:` 等）は**利用者指定が優先**（上書き）
5. ブール属性（`disabled` 等）はRails流の挙動に委ねる

この規則により「upstreamが静的に持つ属性（例: buttonの `type` が未指定なら既定なし）」と
「利用者の属性指定」の衝突が起きない。適合試験は class と data-slot の一致を検証し、
静的属性（`static_attributes`）についても契約との一致を検証する（[07-testing](testing.md) §3）。

## 7. コンポーネント実装テンプレート

新規コンポーネント追加時の標準形。**この形から外す場合、理由をコードコメントではなく
本ドキュメントに記録する**。

```ruby
# typed: strict
# frozen_string_literal: true

module Shadcn
  class Button < BaseComponent
    # 1) シグネチャ: upstreamのpropのみ。既定値は契約から
    sig { params(variant: T.any(Symbol, String), size: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void }
    def initialize(variant: Contracts::Button::DEFAULTS.fetch(:variant),
                   size: Contracts::Button::DEFAULTS.fetch(:size), **args)
      @variant = normalize_option(:button, :variant, variant)
      @size = normalize_option(:button, :size, size)
      super(**args)
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    attr_reader :variant, :size
    # ...（実装詳細）
  end
end
```

チェックリスト（新規コンポーネントPRのテンプレートに組み込む）:

- [ ] upstreamアイテムが `vendor/` に存在し、契約が生成されているか
- [ ] 命名が命名表（§2）と一致しているか
- [ ] クラス定義を1つも手書きしていないか（`Classes.resolve` 経由のみ）
- [ ] `data-slot` が契約のスロット一覧と完全一致しているか（適合試験が担保）
- [ ] upstream propのうち「対応しないもの」をこのドキュメントに記載したか
- [ ] システムスペック（インタラクティブの場合）があるか（[07-testing](testing.md) §5）
- [ ] Lookbookプレビューがあるか（[07-testing](testing.md) §7）
- [ ] `srb tc` / `rubocop` が緑か

## 8. 利用側のインターフェースまとめ

```ruby
# 基本
render Shadcn::Button.new { "保存" }

# バリアント
render Shadcn::Button.new(variant: :destructive, size: :sm, disabled: true) { "削除" }

# リンクボタン（asChild代替）
render Shadcn::Button.new(tag: :a, href: post_path(post)) { "詳細" }

# クラスだけ欲しい場面（自前要素に適用）
class: Shadcn::Button.classes(variant: :link)

# 複合
render Shadcn::Alert.new do |alert|
  render Shadcn::Alert::Title.new { "..." }
  render Shadcn::Alert::Description.new { "..." }
end
```

`.classes` モジュール関数は各コンポーネントクラスに生成しない（手書き1行の DSL で BaseComponent 側に定義）。
これは「ViewComponentとして使う」以外に「クラス文字列の提供源」という価値を持ち、
ホストが自前ERBに段階的に導入する経路を開く。
