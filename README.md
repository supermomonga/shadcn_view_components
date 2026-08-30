# shadcn_view_components

[shadcn/ui](https://ui.shadcn.com/)(base-nova スタイル)を [Rails ViewComponent](https://viewcomponent.org/) + Stimulus として移植する Rails エンジンgem。

単なる一回の移植ではなく、**shadcn/ui のバージョンアップへの追従コストを最小化する**ことを第一の設計目標とする:

1. **決定論的な生成パイプライン** — upstream レジストリから機械的に導出できるもの(クラス文字列・バリアント定義・`data-slot` 構造・CSS変数)はすべて自動抽出・自動生成し、コミットされた生成物として扱う
2. **自動的な乖離検知** — upstream が変わった際に、適合試験(conformance tests)が互換性の崩れを自動検出する
3. **型付きコードベース** — Sorbet(`typed: strict`)による静的型検査を全面採用

クライアントサイドのふるまいは React/Radix を持ち込まず、**Stimulus + Hotwire + ネイティブHTML要素**による Rails 流の再実装。クラス名・`data-slot`・ARIA属性といった「見た目と構造の契約」は upstream 由来の生成物として維持されるため、視覚的な追従は自動化される。

設計の詳細は `docs.local/` の計画書群(00〜10)を参照。

## ステータス

Phase 0〜4 完了 — vendor の全61アイテムを実装(calendar は個別契約として提供)。ロードマップは `docs.local/10-roadmap.md` 参照。

- 提供コンポーネント(26アイテム / 全エクスポートが適合試験で検証済み):
  **Button, Badge, Alert, Card, Avatar, Separator, Skeleton, Table, Label, Kbd, Spinner,
  Empty, AspectRatio, Item, Marker, Input, Textarea, Breadcrumb,
  Accordion, Checkbox, Collapsible, RadioGroup, ScrollArea, Switch, Toggle, ToggleGroup,
  Tabs, Carousel, Pagination, Form::Item, Form::Error,
  Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Tooltip,
  DropdownMenu, ContextMenu, Menubar, NavigationMenu, Command, Combobox,
  Resizable::PanelGroup, Resizable::Panel, Resizable::Handle,
  Progress, Slider, NativeSelect, InputOTP, Select, Field, InputGroup,
  ButtonGroup, DirectionProvider,
  Sidebar, Attachment, Bubble, Message, MessageScroller,
  Chart::Container, Chart::TooltipContent, Chart::LegendContent, Chart::Style, Sonner::Toaster,
  Calendar**
- calendar は react-day-picker の実行時クラス合成のため静的抽出の対象外。
  契約は lib/shadcn_view_components/contracts/calendar.rb に個別契約として保守し、
  コンポーネントは月テーブル(年月ナビ・日付ボタン)として提供する
- インタラクティブふるまい(05 §3 ネイティブ最優先): toggle/toggle-group は Stimulus、
  accordion/collapsible は `<details>`/`<summary>`、dialog系は `<dialog>` + showModal、
  popover/tooltip/menu は Popover API
- DropdownMenu / ContextMenuはARIA menu、Menubarは複数のARIA menuを束ねるmenubar、
  NavigationMenuはネイティブの`nav` / リンクとして、それぞれ独立したキーボード操作を提供する
- upstream 出所: `vendor/shadcn/manifest.json` が唯一の真実の源(現在: shadcn@4.19.0 系)

### 公開コンポーネントの境界

公開コンポーネントとして管理するクラスは、すべて`.new`して描画できるViewComponentである。
`Shadcn::Chart`、`Shadcn::Form`、`Shadcn::Resizable`、`Shadcn::Sonner`は名前空間であり、
描画には上記一覧の配下クラスを使う。公開コンポーネントの一覧は
`spec/conformance/registry.yml`で管理し、各クラスの契約と最小構成での描画を自動検証する。
基底クラスと内部ナビゲーション用クラスは公開APIに含まれない。

## インストール

```ruby
# Gemfile
gem "shadcn_view_components"
```

```bash
bundle install
bin/rails generate shadcn_view_components:install
```

インストーラはホストのTailwindエントリCSSに次を追記する(冪等):

```css
@import "tailwindcss";

/* gemが供給するテーマ(Sprockets/Propshaftが解決) */
@import "shadcn/shadcn.css";

/* ★必須: gem内コンポーネントのクラス抽出対象を明示 */
@source "<gemのインストールパス>/app/components";
```

**`@source` 指定が必須**である理由: Tailwind v4の自動コンテンツ検出はgem内部を走査しない。この指定がないと、コンポーネントの契約クラスがCSSに含まれず素のHTMLとして表示される(最も多い導入トラブル)。gemアップデートでパスが変わったらインストーラを再実行するとパスが最新化される。

**アニメーション**: テーマCSSは `@import "tw-animate-css"` を含む(upstreamのshadcnインストールと同じ)。開閉・ポップオーバーのアニメーション(animate-in/out、accordion-down/up等)のため、ホストのnode環境に `tw-animate-css` がインストール済みであること:

```bash
npm install tw-animate-css   # または pnpm add / yarn add
```

### JS(インタラクティブコンポーネント利用時)

importmap-rails利用時はエンジンが自動pinする:

```js
// app/javascript/application.js
import { register } from "@supermomonga/shadcn-view-components"
register(application)
```

自動pinを使えないimportmap-rails環境では、次を `config/importmap.rb` に追加する:

```ruby
pin_all_from ShadcnViewComponents::Engine.root.join("app/assets/javascripts/shadcn"),
             under: "@supermomonga/shadcn-view-components",
             to: "shadcn"
```

jsbundling-rails等のbundlerを使う場合は、generatorでESM packageをrepository内の
安定した相対pathへ同期し、そのlocal dependencyを追加する:

```bash
bin/rails generate shadcn_view_components:install --javascript=bundler
pnpm add ./vendor/shadcn_view_components/javascript
# npm install ./vendor/shadcn_view_components/javascript でも可
```

`@hotwired/stimulus` はホスト側のdependencyを使う。登録コードはimportmapと同じで、
`import { register } from "@supermomonga/shadcn-view-components"` に統一される。
gem更新後はgeneratorとpackage managerのinstallを再実行し、同期されたpackageをcommitする。

## 使い方

```ruby
# 基本
render(Shadcn::Button.new) { "保存" }

# バリアント
render(Shadcn::Button.new(variant: :destructive, size: :sm, disabled: true)) { "削除" }

# リンクボタン(asChild代替 — タグ差し替え。data-slot・クラスは維持)
render(Shadcn::Button.new(tag: :a, href: post_path(post))) { "詳細" }

# クラスだけ欲しい場面(自前要素に適用)
Shadcn::Button.classes(variant: :link)

# 複合(ERBでは自然に書ける)
<%= render(Shadcn::Card.new) do %>
  <%= render(Shadcn::Card::Header.new) do %>
    <%= render(Shadcn::Card::Title.new) { "タイトル" } %>
  <% end %>
  <%= render(Shadcn::Card::Content.new) { "本文" } %>
<% end %>

# 浮動要素の配置(Popover / Tooltip / HoverCard / Menu系Contentで共通)
render(Shadcn::Popover::Content.new(
  side: :right,
  align: :start,
  side_offset: 8,
  align_offset: 0,
  collision_padding: 5
)) { "内容" }

# JSで操作する装飾Select。default_valueはhidden inputへ入り、nameでフォーム送信される
render(Shadcn::Select.new(name: "framework", default_value: "rails")) do
  safe_join([
    render(Shadcn::Select::Trigger.new) do
      render(Shadcn::Select::Value.new(placeholder: "選択してください"))
    end,
    render(Shadcn::Select::Content.new) do
      safe_join([
        render(Shadcn::Select::Item.new(value: "rails")) { "Ruby on Rails" },
        render(Shadcn::Select::Item.new(value: "hanami")) { "Hanami" }
      ])
    end
  ])
end
```

注意: 純Rubyのコード(`#call` 内等)で複数の子を `render` で連ねるときはブロックの
戻り値しか使われないため `safe_join([...])` で連結する(ERBでは出力バッファが連結するため不要)。

- バリアント値は Symbol / String 両方を受け付ける。契約に存在しない値は `ArgumentError`(fail-fast)
- data属性・ARIA・CSS値になる意味的プロパティも同様に描画前に検証する。たとえば
  `orientation` は `horizontal/vertical`、Toggle状態は `off/on`、Sheetの `side` は
  `top/right/bottom/left`、Toggle Groupの `type` は `single/multiple`
- 数値プロパティは有限の数値または厳密な数値文字列だけを受け付ける。`nil`、上下限、既定値を含む
  個別の制約は `Shadcn::Progress.property_contract(:value)` のように確認できる
- 浮動要素の `side` は `top/right/bottom/left/inline-start/inline-end`、`align` は
  `start/center/end`。画面端では実配置を反転・調整し、scrollやresizeにも追従する
- `Select` は単一値の装飾listboxで、Stimulus登録が必要。JS不要、`multiple`、ブラウザ標準の
  制約検証が必要なフォームには、実際の`<select>`を描く`NativeSelect`を使う
- `class:` で渡した追加クラスは `tailwind_merge` により契約クラスと統合される(利用者の上書きが後勝ち)
- テーマのカスタマイズは CSS変数の上書きが唯一の公式経路(`@import` より後に書く)

## 開発

```bash
bin/setup              # mise toolchain + Ruby + 全JavaScript依存を導入
bundle exec rake verify # CI必須検査を同じRake taskで順に実行

bundle exec rake verify:spec           # component/conformance/contract/generator/request
bundle exec rake verify:system         # ふるまい(Cuprite + Chrome)
bundle exec rake verify:parity         # visual + animation parity
bundle exec rake verify:javascript     # extractor + distributed JS lint/typecheck/DOM/bundle tests
bundle exec rake verify:sorbet         # Sorbet + RBI freshness
bundle exec rake verify:generated      # 生成物の決定性
bundle exec rake verify:tailwind       # Tailwind build
bundle exec rake verify:rubocop        # Ruby lint
mise run lookbook                      # プレビュー(http://localhost:9292/)
mise run build-css                     # Lookbook用の静的スタイル再生成
```

Lookbook は dummy アプリのルートパス(`/`)で開く。プレビューツールバーには
**Theme トグルボタン(月/太陽アイコン)** があり、プレビューの
ライト/ダークを切り替えられる(選択はクッキーに永続化)。反映はプレビュー専用レイアウト
(`spec/dummy/app/views/layouts/preview.html.erb`)が `<html class="dark">` として行う。
ボタンは Lookbook の display option「theme」(select)のテンプレートを差し替えたもので
(`spec/dummy/config/initializers/lookbook_theme_toggle.rb` 参照)、動作経路は Lookbook 組み込みのままである。

### 生成パイプライン

```
rake shadcn:sync      # upstream レジストリを取得 → vendor/shadcn/(ネットワーク使用)
rake shadcn:generate  # vendor から契約JSON + Ruby + CSS を生成(オフライン)
rake shadcn:update    # sync + generate(追従作業のフルセット)
rake shadcn:check     # 決定論性検証(一時ディレクトリ生成とコミット済み生成物のバイト比較)
```

`shadcn:sync` は、upstream の内容と revision が前回から変わらない場合、manifest の
`fetched_at` / `checked_at` を保持する。同じ入力を再同期しても時刻だけの差分は作られない。
同期時は unversioned なregistry一式とGitHub release metadataを処理の前後で二度確認し、
内容が安定している場合だけ完成済みstaging directoryを `vendor/shadcn` へ置換する。404、
通信失敗、JSON/schema不正、同期中の変更では既存snapshotを変更せず、`[sync:<種別>]` と
`retryable=true|false` をエラーへ出す。

編集ポリシー(詳細は `docs.local/01-architecture.md` §2):

| パス | 性質 | 編集 |
|---|---|---|
| `app/components/shadcn/` | 手書き | 可 |
| `app/assets/javascripts/shadcn/` | 手書き | 可 |
| `tools/extractor/` | 手書き(パイプライン本体) | 可 |
| `vendor/shadcn/` | スナップショット | `rake shadcn:sync` のみ |
| `gen/contracts/`, `lib/shadcn_view_components/generated/`, `app/assets/stylesheets/shadcn/` | **生成物** | 禁止(再生成) |

### 新規コンポーネント追加(Phase 1以降)

1. `tools/extractor/config/targets.json` にアイテム名を追加 → `rake shadcn:generate`
2. `app/components/shadcn/<name>.rb` + `<name>.html.erb` を実装(クラスは `Classes.resolve` 経由のみ。04 §7のチェックリスト参照)
3. `spec/conformance/registry.yml` に1行追加(該当アイテムを `pending` から実装へ)→ 適合試験が自動的に全組み合わせを検証

### 週次upstream追従

`.github/workflows/upstream-drift.yml` が毎週月曜 09:00 JST に `rake shadcn:update`
を実行する。差分があれば、Chromeを含む全依存を用意して
`bundle exec rake verify` の8検査を先に実行し、全て成功した場合だけ自動PR
(`chore/upstream-sync`) を作成する。検証失敗はworkflow自体の失敗となり、PRは作成しない。

PR作成は `github.token` に固定し、最初にdraftで作成する。同じhead branchを指定して
`CI` workflowを `workflow_dispatch` する。GitHubの再帰防止により、`github.token` が
作成したPRの `pull_request` eventが起動しない場合でも、PR headに必須の
8 status checkが付く。その8個が実際に作成された後だけreview readyにする。
PR本文とActions summaryには、upstreamの完全なcommit SHA、
registry snapshot hash、取得日時、先行検証の結果とworkflow URLを記録する。手動実行は
`workflow_dispatch` から行う。

リポジトリ設定ではActionsにPull Request作成を許可し、mainの必須checkを
`lint-ruby`, `lint-js`, `sorbet`, `rspec`, `system`, `parity`, `determinism`,
`tailwind-build` に固定する。専用PATやApp tokenは使用しない。

### 見た目のupstreamパリティ検証(visual parity)

各コンポーネントの見た目が元のshadcn/ui実装(vendor/shadcn のReact実装)と一致するかをピクセル比較で機械判定する仕組み。契約による「クラス文字列の一致」、コンポーネントspecによる「DOM構造の一致」の先にある最終段(「CSS適用結果を含めた見た目の一致」)を検証する。

```bash
bundle exec rake parity:run                      # または mise run parity(ハーネスを明示的に再ビルド)
PARITY_RATIO=0.01 bundle exec rake parity:run    # 閾値を1%に緩和(既定 0.5%)
bundle exec rake parity:update                   # 追跡baselineを意図して更新するときだけ実行
```

仕組み: `vendor/shadcn` の tsx を `tools/visual-parity` で展開し、Vite + React で実際に描画(upstream側)。dummy の Lookbook プレビュー(うち側)と同じ Chromium(Cuprite)でスクリーンショットを撮り、pixelmatch で差分率を判定する。upstream側のスタイルは upstream 実アプリの globals.css 相当のみを抽出器が生成した `tools/visual-parity/src/upstream_theme.css`(トークン + npm `shadcn/tailwind.css` の verbatim取り込み)から与えられ、gem の `shadcn.css` とは独立している。これにより shadcn.css への移植漏れ・移植ミス(例: カスタムバリアント未定義でクラスが沈黙する)が upstream 側との差分として検出される(共有してしまうと両側が同じだけ壊れて差分が消えるため)。両側でアニメーションを停止し、同一ブラウザ・同一フォントで比較するため決定論的。各シナリオは **light/dark 両カラースキーム**で撮影する(dark は両側の `<html>` に `.dark` を付与。`dark:bg-destructive/60` 等の dark時ユーティリティや `.dark` トークンの差分はこのモードでしか検出できない)。

さらにアニメーションパリティ(`spec/visual/animation_parity_spec.rb`)では、両側のコンポーネントを開いた直後に WAAPI でアニメーションを取得・停止し、currentTime を同一チェックポイント(0/25/50/75/100%)に固定した上で補間値(opacity / transform / 高さ)とアニメーション名・持続時間・イージングを比較する。時間を仮想化するため実行タイミングに影響されない(drawer は upstream が vaul のJSバネ物理で動くため対象外)。

- 素の `bundle exec rspec` でも**常時実行される**。upstream参照サーバ(vite preview)のキャッシュビルドと起動・停止は `spec/support/parity_server.rb` が自動で行う(ビルド入力のハッシュが変わらなければ再ビルドを省略)。明示的に外したいときだけ `PARITY=0 bundle exec rspec`
- CI でも必須ジョブ(`parity`)として実行される
- 通常実行の成果物はgitignore済みの `tmp/visual-parity/run-<pid>/<demo>/<light|dark>/`
  (ours.png / upstream.png / diff.png / report.json)へ出力する。CI失敗時は同じ内容を
  `visual-parity-<run id>-<attempt>` artifactとして7日間保存する
- 追跡中の `spec/visual/baselines/` は通常テストから変更しない。
  `bundle exec rake parity:update` を明示的に実行した場合だけ更新し、画像差分をレビューしてCommitする
- 初期セットは13シナリオ(うち11がピクセル完全一致、残り2件も0.06〜0.22%)

**シナリオの追加手順**:

1. 対象コンポーネントの Lookbook プレビュー(`spec/dummy/app/components/previews/shadcn/*_preview.rb`)を用意
2. `tools/visual-parity/src/demos.tsx` に同じテキスト・props・並びのJSXデモを追加(キーは `<コンポーネント>/<シナリオ>`)
3. `spec/visual/parity_spec.rb` の `SCENARIOS` に `[プレビューのパス, デモID]` を1行追加

`tools/visual-parity/src/components/ui/`(展開したupstreamソース)と `dist/` は gitignore 済みで、`pnpm run unpack` / `vite build` が常に `vendor/shadcn` から再生成する(sha256検証つき)。

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| スタイルがまったく当たらない | `@source` 未指定 | インストーラを再実行 |
| ダークモードが効かない | `.dark` の付与先が `<html>` 以外 | `<html class="dark">` に付与 |
| 変数を上書きしたのに反映されない | 上書き位置が `@import` より前 | importより後に書く |
| クラスの競合が意図どおりに解決されない | `tailwind_merge` gemのバージョン差 | issueで報告 |

## ライセンス

MIT
