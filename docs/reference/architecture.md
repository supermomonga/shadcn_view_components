# 01 — アーキテクチャとリポジトリ構成

- ステータス: **Current**（現行実装の保守者向け設計資料）
- 対象読者: コントリビューター全員
- 関連ドキュメント: [00-overview](overview.md) / [02-upstream-sync](upstream-sync.md) / [03-extraction-codegen](extraction-codegen.md) / [04-component-conventions](component-conventions.md)

---

## 1. 全体像

本ライブラリは **Railsエンジンgem** として、次の4種類の資産をホストアプリに提供する。

1. **ViewComponent**（`app/components/shadcn/`） — 手書き。構造（ERBテンプレート）とサーバーサイドAPI
2. **Stimulusコントローラ**（`app/assets/javascripts/shadcn/`） — 手書き。ビルドレスESM。ふるまい
3. **テーマCSS**（`app/assets/stylesheets/shadcn/shadcn.css`） — **生成物**。upstreamの `cssVars` / `css` 由来
4. **契約データ**（`lib/shadcn_view_components/generated/`） — **生成物**。コンポーネントが実行時に参照するクラスマップ

さらにリポジトリには、生成パイプラインを構成する資産が3つある。

5. **vendor スナップショット**（`vendor/shadcn/`） — upstreamレジストリの生データ + manifest。抽出器の唯一の入力
6. **抽出器・生成器**（`tools/extractor/`） — Node + TypeScript + Babel。`rake shadcn:*` タスクから起動される
7. **適合試験**（`spec/conformance/`） — 生成された契約とレンダリング結果の一致を検証するRSpec

設計上の最重要原則は **「手書き領域と生成領域の分離」** である。この分離により、
upstream追従時の差分は必ず「生成物のdiff」として現れ、レビュー可能になる。

## 2. リポジトリ構成

```
shadcn_view_components/
├── mise.toml                                  # ruby 4.0+, node LTS
├── shadcn_view_components.gemspec
├── Gemfile / Gemfile.lock
├── Rakefile                                   # shadcn:* タスクを読み込む
│
├── lib/
│   ├── shadcn_view_components.rb              # エントリポイント。requireまとめ
│   └── shadcn_view_components/
│       ├── engine.rb                          # Rails::Engine定義
│       ├── version.rb                         # VERSION（独自semver）
│       ├── classes.rb                         # Contracts参照ヘルパ（ShadcnViewComponents::Classes）
│       │
│       └── generated/                         # ★生成物（コミット対象・直接編集禁止）
│           └── contracts/
│               ├── button.rb                  # module ShadcnViewComponents::Contracts::Button
│               ├── card.rb                    #   BASE_CLASS / VARIANTS / SLOTS / ... 定数
│               └── ...                        #   ※ typed: strict, sig付き
│
├── app/
│   ├── components/
│   │   └── shadcn/
│   │       ├── base_component.rb              # 共通基底（属性マージ・クラス解決・契約参照）
│   │       ├── button.rb + button.erb         # 手書きコンポーネント
│   │       ├── card.rb  + card.erb
│   │       └── ...
│   │
│   └── assets/
│       ├── tailwind/
│       │   └── shadcn_view_components/
│       │       └── engine.css                 # tailwindcss-rails Engine入力
│       ├── stylesheets/
│       │   └── shadcn/
│       │       └── shadcn.css                 # ★生成物（テーマ: 変数/keyframes/utility）
│       └── javascripts/
│           └── shadcn/
│               ├── index.js                   # register(application) エクスポート
│               └── controllers/
│                   ├── dialog_controller.js   # 手書きESM（ビルドレス）
│                   ├── tabs_controller.js
│                   └── ...
│
├── vendor/
│   └── shadcn/                                # ★upstreamスナップショット（コミット対象）
│       ├── manifest.json                      #   出所ref・取得日時・アイテム毎のSHA256
│       └── registry/
│           └── items/
│               ├── button.json                #   upstreamレジストリアイテムの生データ
│               └── ...
│
├── gen/
│   └── contracts/                             # ★生成物（コミット対象）
│       ├── button.json                        #   契約JSON（中間表現・差分レビューの主戦場）
│       └── ...
│
├── tools/
│   └── extractor/                             # 抽出器・生成器（Node + TypeScript）
│       ├── package.json / pnpm-lock.yaml
│       ├── tsconfig.json
│       └── src/
│           ├── cli.ts                         # サブコマンド: fetch / extract / generate / check
│           ├── fetch.ts                       # vendor スナップショット取得
│           ├── parse/                         # TSX AST解析（cva / cn / data-slot）
│           ├── contract.ts                    # 契約スキーマ定義（Zod）
│           ├── emit/                          # JSON / Ruby / CSS 出力
│           └── normalize.ts                   # 決定論的整形規則
│
├── lib/tasks/
│   └── shadcn.rake                            # shadcn:sync / extract / generate / check
│
├── sorbet/
│   ├── config
│   └── rbi/
│       ├── gem/                               # tapioca生成RBI（コミット対象）
│       └── todo.rbi
│
├── spec/
│   ├── dummy/                                 # マウント用ダミーRailsアプリ（Lookbook入り）
│   ├── components/                            # コンポーネントスペック（API・レンダリング）
│   ├── conformance/                           # ★適合試験（契約 vs レンダリング）
│   ├── system/                                # Cupriteシステムスペック（Stimulusふるまい）
│   └── contracts/                             # 生成物自体の整合性スペック
│
├── .github/workflows/
│   ├── ci.yml                                 # lint / srb / rspec / determinism
│   └── upstream-drift.yml                     # 週次ドリフト検知 + 自動PR
│
└── docs/                                # 公開設計資料（00〜09 current、10 historical）
```

### 各ディレクトリの役割と編集ポリシー

| パス | 性質 | 編集 | レビュー時の見方 |
|---|---|---|---|
| `app/components/shadcn/` | 手書き | 可 | 通常のコードレビュー |
| `app/assets/javascripts/shadcn/` | 手書き | 可 | 通常のコードレビュー |
| `app/assets/stylesheets/shadcn/shadcn.css` | **生成物** | 禁止（再生成） | 差分の意味は `vendor/` の差分と突き合わせる |
| `lib/shadcn_view_components/generated/` | **生成物** | 禁止（再生成） | 同上 |
| `gen/contracts/` | **生成物** | 禁止（再生成） | **upstream差分レビューの主戦場**。クラス変更はここに現れる |
| `vendor/shadcn/` | スナップショット | `rake shadcn:sync` のみ | upstream生データの変更内容確認 |
| `tools/extractor/` | 手書き（パイプライン本体） | 可 | 抽出ロジック変更は影響大のため慎重に |

## 3. エンジン設計

### 3.1 gemspec

```ruby
# shadcn_view_components.gemspec（要旨）
Gem::Specification.new do |spec|
  spec.name = "shadcn_view_components"
  spec.add_dependency "rails", ">= 8.1"        # ActionView / Rails要件
  spec.add_dependency "view_component", ">= 4.0"
  spec.add_dependency "tailwind_merge"          # ユーザー追加クラスとのマージ
  spec.add_dependency "tailwindcss-rails", ">= 4.3"
  spec.add_development_dependency "sorbet-static", "~> 0.5"
  # ...（rspec / cuprite / lookbook / tapioca / rubocop は development）
end
```

- 依存gemは最小限。`tailwind_merge` は「利用者が `class:` で上書きクラスを渡した際の競合解決」に必要（[04-component-conventions](component-conventions.md) §6）。
- Node.jsはgemの実行時依存ではない。`tools/extractor` の開発時依存であり、ホストアプリには一切要求しない。

### 3.2 エンジンの初期化

```ruby
# lib/shadcn_view_components/engine.rb（要旨）
module ShadcnViewComponents
  class Engine < ::Rails::Engine
    isolate_namespace ShadcnViewComponents

    initializer "shadcn_view_components.assets" do |app|
      app.config.assets.paths << root.join("app/assets/javascripts")
    end

    # importmap-railsの標準engine統合へmap定義とcache監視対象を追加する
    initializer "shadcn_view_components.importmap", before: "importmap" do |app|
      next unless app.config.respond_to?(:importmap)

      app.config.importmap.paths << root.join("config/importmap.rb")
      app.config.importmap.cache_sweepers << root.join("app/assets/javascripts")
    end
  end
end
```

- **CSS**: `tailwindcss-rails >= 4.3`が`app/assets/tailwind/shadcn_view_components/engine.css`を
  検出し、ホストの`app/assets/builds/tailwind/`へwrapperを生成する。生の`shadcn.css`を
  Sprockets / Propshaftで直接precompileせず、最終成果物はホストのTailwindビルドだけが供給する
  （[06-theming-tailwind](theming-tailwind.md) §5）。
- **JS**: `importmap-rails` 利用時は上記により `import { register } from "@supermomonga/shadcn-view-components"` が可能。
  importmap非利用（jsbundling-rails等）のホストは、インストーラがrepository内へ同期する
  ESM packageをlocal dependencyとして追加し、同じpackage名からimportする（§3.3）。
- 自動pinに失敗する環境向けに、**手動pin行をドキュメント化**したフォールバックを必ず用意する（マジックに依存しない）。

### 3.3 インストーラジェネレータ

```
bin/rails generate shadcn_view_components:install
```

- `app/assets/tailwind/application.css`に`tw-animate-css`とEngine wrapperの固定`@import`を追記する。
  入力ファイルがなければ`tailwindcss:install`の実行を求めて失敗する。ホストへgemの物理パスや
  `@source`は書かない（詳細は [06-theming-tailwind](theming-tailwind.md) §5）
- importmapでは `@supermomonga/shadcn-view-components` を自動pinする。bundlerではESM packageを
  `vendor/shadcn_view_components/javascript` へ同期し、local dependencyとして追加する
- `app/javascript/application.js` 等に `import { register } from "@supermomonga/shadcn-view-components"; register(application)` スニペットの追記を案内する
- ジェネレータは**冪等**であること（二回実行で重複行を作らない）

## 4. レイヤーと依存規則

```
┌──────────────────────────────────────────────────────┐
│  L0: vendor/shadcn/            （upstream生データ）     │
└────────────────────┬─────────────────────────────────┘
                     │ 読み取り（sync以外は誰も書かない）
                     ▼
┌──────────────────────────────────────────────────────┐
│  L1: tools/extractor           （解析・生成）            │
└────────────────────┬─────────────────────────────────┘
                     │ 書き込み（生成）
                     ▼
┌──────────────────────────────────────────────────────┐
│  L2: 生成物                                             │
│    gen/contracts/*.json                                │
│    lib/shadcn_view_components/generated/               │
│    app/assets/stylesheets/shadcn/shadcn.css            │
└────────────────────┬─────────────────────────────────┘
                     │ 参照（ランタイム・読み取り専用）
                     ▼
┌──────────────────────────────────────────────────────┐
│  L3: 手書き実装                                          │
│    app/components/shadcn/   （ViewComponent・構造）       │
│    app/assets/javascripts/shadcn/  （Stimulus・ふるまい）  │
└──────────────────────────────────────────────────────┘
```

依存規則（生成物の手編集は`verify:generated`、契約との乖離はRSpec、Ruby規約はRuboCopで検査する）:

1. **L3はL2を参照してよいが、書き換えてはならない**
   - コンポーネントは `ShadcnViewComponents::Contracts::<Name>` の定数と
     `ShadcnViewComponents::Classes` ヘルパ経由でのみクラス文字列を得る
   - コンポーネント内にクラス文字列リテラルを書かない（動的に組み立てる装飾を除く。詳細は [04-component-conventions](component-conventions.md) §5）
2. **L2はL1の出力のみから生成される** — extractorは `vendor/shadcn/` 以外のリポジトリファイル状態に依存しない
3. **L0を書けるのは `rake shadcn:sync` のみ** — 手編集禁止
4. **L1（extractor）はRailsをロードしない** — 純粋なNodeプログラム。Rails側の都合で抽出結果を変えない
5. **StimulusコントローラはRubyを知らない / ViewComponentはJSを知っている**
   - コンポーネントは `data-controller` 属性の描画だけを行う
   - コントローラとコンポーネントの結合点は **`data-controller` 名と `data-<controller>-target` / `data-<controller>-value` の命名規約のみ**（[05-stimulus-hotwire](stimulus-hotwire.md) §2）

## 5. ランタイムのクラス解決

コンポーネントのERBは、クラス文字列を直接持たない。かわりに `Classes` ヘルパを通して契約を引く:

```ruby
# lib/shadcn_view_components/classes.rb（要旨・型は省略）
module ShadcnViewComponents
  module Classes
    module_function def resolve(name, **options)
      contract = Contracts.const_get(name.to_s.camelize)
      # 事前解決済みの組み合わせテーブルから完全一致を引き、
      # 呼び出し元の追加クラスと tailwind_merge で統合する
      TailwindMerge::Merger.new.merge(
        [contract.combination(**options), extra].compact.join(" ")
      )
    end
  end
end
```

ここで「事前解決済みの組み合わせテーブル」とは、抽出器がバリアント×サイズ×ブールフラグの
全組み合わせを列挙し、Node上で本物の `cva` + `tailwind-merge` を実行して得た**最終クラス文字列**である
（経緯と理由は [03-extraction-codegen](extraction-codegen.md) §5）。Ruby側にマージロジックの
再実装を持たないことが、upstreamとの視覚的一致を保証する要点である。

## 6. クロスカッティングな関心事

### 6.1 エラー戦略

- 契約に存在しないバリアント名が渡された場合: `ArgumentError`（fail-fast）。
  typoを静かにデフォルトへ落とさない。契約のキー集合は `Contracts::<Name>.variants` で参照可能
- upstreamでバリアントが削除された場合: 生成物からキーが消え、利用コードは `ArgumentError` で即座に気づく。
  これも「自動検知」の一部として設計している

### 6.2 スレッドセーフ・ロード順序

- 生成物のRubyは定数のみ（frozen string）。実行時状態を持たないためスレッドセーフ
- `lib/` 配下はgemのrequireで明示ロード、`app/components` はエンジンのautoloadに委ねる
  （zeugmap等のautoload懸念は ViewComponent の標準配置に従うことで回避）

### 6.3 セキュリティ

- `vendor/shadcn/` のJSONは信頼できるupstream由来とはいえ、**生成時にスキーマバリデーション（Zod）を通す**
  （悪意ある/壊れたアイテムが生成物を汚染しないように。詳細は [03-extraction-codegen](extraction-codegen.md) §4）
- ERBでのHTMLエスケープはViewComponent標準に従う。クラス文字列の埋め込みは
  属性としてエスケープされる経路のみ使う
