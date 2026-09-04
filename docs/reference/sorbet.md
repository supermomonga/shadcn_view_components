# 08 — Sorbet 型付け方針

- ステータス: **Current**（現行実装の保守者向け設計資料）
- 対象読者: コンポーネント実装者・CI管理者
- 関連ドキュメント: [00-overview](overview.md) / [01-architecture](architecture.md) / [04-component-conventions](component-conventions.md) / [09-ci-drift-detection](ci-drift-detection.md)

---

## 1. 方針

| 項目 | 方針 |
|---|---|
| 厳格度 | **`app/`・`lib/` のRubyを`typed: strict`で検査**する。`spec/`・`tools/`・生成入力は`sorbet/config`で除外 |
| RBI | 依存gem（rails, view_component, tailwind_merge等）は **tapioca で生成してコミット** |
| CI | `srb tc` を通常CIに常時組み込み、redはマージブロック |
| 生成物 | 抽出器が生成するRubyにもsigを注入（[03](extraction-codegen.md) §6.1）。生成物で型エラーが出たら抽出器のバグ |
| Rails RBI | `sorbet-rails` は導入せず、依存gemのRBIをTapiocaで生成・検証する |
| ERB | 型検査対象外。**ロジックをERBに書かない**規約で補完（§4） |

`typed: strong` を避ける理由: ViewComponentのERBレンダリング経路やRailsの動的拡張（`content_tag` 等）で
strongが要求する完全性は実益に対してコストが高い（ヒアリング時の評価を維持）。

## 2. セットアップ構成

```
sorbet/
├── config
│   └── （内容: --dir lib app を対象に指定。spec/ は型検査対象に含めない ※下記注記）
└── rbi/
    ├── gem/                    # tapioca gem RBIs（コミット）
    │   ├── rails.rbi
    │   ├── view_component.rbi
    │   └── ...
    └── todo.rbi                # 空に保つことを目標とする（許容上限: 0シグニチャ）
```

- `sorbet/config`:
  ```
  --dir
  .
  --ignore=vendor
  --ignore=tools
  --ignore=spec/dummy
  --ignore=gen
  --ignore=spec
  --ignore=tmp
  --ignore=node_modules
  ```
- **`todo.rbi` をゼロに保つ**ことを運用ルールとする（妥協シグネチャの追加はPRで説明を要する）
- tapioca設定（`tapioca/config.yml`）の`gem`コマンドで依存RBIを一括生成し、CIは
  `bundle exec tapioca gem --verify`で`Gemfile.lock`との一致を検査する
- `.rubocop.yml` は `Sorbet/StrictSigil` を `app/**/*.rb` と `lib/**/*.rb` に適用する。
  sigの型整合性と不足は `srb tc`、sig内部の記述順などは有効な `rubocop-sorbet` のcopで検査する

## 3. コンポーネントコードの型付けパターン

### 3.1 標準形（[04](component-conventions.md) §7 と同一）

```ruby
# typed: strict
# frozen_string_literal: true

module Shadcn
  class Button < BaseComponent
    sig { params(variant: T.any(Symbol, String), size: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void }
    def initialize(variant: Contracts::Button::DEFAULTS.fetch(:variant),
                   size: Contracts::Button::DEFAULTS.fetch(:size), **args)
      @variant = T.let(nil, T.nilable(T.any(Symbol, String)))  # → 実際は normalize_option の戻り型に寄せる
      @variant = normalize_option(:button, :variant, variant)
      # ...
      super(**args)
    end
  end
end
```

### 3.2 BaseComponentの主要シグネチャ（設計指針）

```ruby
module Shadcn
  class BaseComponent < ViewComponent::Base
    ### HTML属性パススルー
    sig { params(args: T::Hash[Symbol, T.untyped]).void }
    def initialize(**args); end

    ### タグ差し替え（asChild代替）
    sig { returns(String) }        # "button" | "a" | ... Stringで持つ（TagヘルパのI/Fに合わせる）
    def tag; end

    ### バリアント値の正規化 + fail-fast検証
    sig { params(component: Symbol, prop: Symbol, value: T.any(Symbol, String)).returns(Symbol) }
    def normalize_option(component, prop, value); end
    # 契約に存在しない値 → ArgumentError（[01](architecture.md) §6.1）
  end
end
```

### 3.3 型付けの規約

1. **`T.untyped` を避ける**。やむを得ず使う箇所（`**args` の属性値等）は「Railsの属性値は何でも来うる」という
   意味でのみ許可し、境界（BaseComponentの入り口）に限定する
2. **契約由来の値は具体型で受ける**: バリアント値は `Symbol`、クラス文字列は `String`、
   スロット定義は `T::Hash[Symbol, T.untyped]`（生成物との接点のみuntypedを許容）
3. `sig` の可読性のため、複雑な型は `T.type_alias` で命名する（例: `VariantOption = T.type_alias { T.any(Symbol, String) }`）
4. **ViewComponentのslots API**（`renders_one` 等）は動的定義のため型が付きにくい。
   `slot` 宣言直後に `sig` を補完するのではなく、**呼び出し側で使うアクセサに明示的なsigを定義した
   薄いラッパを用意する**形を基本とする（`renders_one` 自体のRBIはTapioca生成RBIへ委ねる）

## 4. ERBと型の境界

- erbsorbet（ERB内型検査）は**導入しない**（決定 #4の補足。[04](component-conventions.md) §2）。
  理由: 導入・保守コストに対し、ERBを「ロジックなし」に保つ規約で十分な品質が得られるため
- ERBに許すもの: ヘルパ呼び出し・ループ・契約参照・インスタンス変数の埋め込み。
  **許さないもの**: 条件のネスト、文字列組み立て、複雑な式
- ERBが参照するインスタンス変数・メソッドには**必ずsigがある**（= ERBから呼べる面は型で守る）

## 5. 生成物の型（抽出器との契約）

[03-extraction-codegen](extraction-codegen.md) §6.1 の生成Rubyは:

- ヘッダに `# typed: strict`
- 全定数に `T.let(...)` と具体型（`T::Hash[Symbol, Symbol]` 等）
- `combination(options)` のsig: `params(options: T::Hash[Symbol, Symbol]).returns(String)`
  （`KeyError` を起こしうることはsig上表現しない。ドキュメント化で担保）

**生成物で `srb tc` が落ちる場合、抽出器のemitterバグ**として扱い、コンポーネント側で修正しない
（手編集は `rake shadcn:check` が検知して即座に失敗する）。

## 6. specの型

- specは `srb tc` の対象外（`--ignore` で外す）。RSpec DSLとの型結合は実益が薄く、
  型検査のコストをライブラリコードに集中させる
- spec/supportも現在は`spec/`除外の対象であり、RSpecとRuboCopで品質を検証する

## 7. CIでの統合

| ジョブ | 内容 |
|---|---|
| `sorbet` | `bundle exec srb tc`。新規ファイルのsig漏れ・型不整合を検知 |
| `rubocop-sorbet` | strict sigilとsigの記述規約（`StrictSigil` / `SignatureBuildOrder` 等）のlint |
| `tapioca` | `tapioca gem --verify`（コミット済みRBIが `Gemfile.lock` と乖離していないこと） |

依存gem追加時の手順（CONTRIBUTINGに記載）:

```
bundle install
bundle exec tapioca gem
bundle exec srb tc
# sorbet/rbi/ の差分をコミット
```
