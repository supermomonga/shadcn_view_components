# shadcn_view_components

[shadcn/ui](https://ui.shadcn.com/)(new-york-v4 スタイル)を [Rails ViewComponent](https://viewcomponent.org/) + Stimulus として移植する Rails エンジンgem。

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
  Tabs, Carousel, Pagination, Form,
  Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Tooltip,
  DropdownMenu, ContextMenu, Menubar, NavigationMenu, Command, Combobox, Resizable,
  Progress, Slider, NativeSelect, InputOTP, Select, Field, InputGroup,
  ButtonGroup, DirectionProvider,
  Sidebar, Attachment, Bubble, Message, MessageScroller, Chart, Sonner(Toaster),
  Calendar**
- calendar は react-day-picker の実行時クラス合成のため静的抽出の対象外。
  契約は lib/shadcn_view_components/contracts/calendar.rb に個別契約として保守し、
  コンポーネントは月テーブル(年月ナビ・日付ボタン)として提供する
- インタラクティブふるまい(05 §3 ネイティブ最優先): toggle/toggle-group は Stimulus、
  accordion/collapsible は `<details>`/`<summary>`、dialog系は `<dialog>` + showModal、
  popover/tooltip/menu は Popover API
- upstream 出所: `vendor/shadcn/manifest.json` が唯一の真実の源(現在: shadcn@4.19.0 系)

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
import { register } from "shadcn"
register(application)
```

importmap非利用のホストは、gem内のESM(`app/assets/javascripts/shadcn/index.js`)を直接importする。手動pinのフォールバック行:

```ruby
# config/importmap.rb
pin "shadcn", to: "shadcn/index.js"
pin_all_from "app/assets/javascripts/shadcn/controllers", under: "shadcn/controllers", preload: false
```

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
```

注意: 純Rubyのコード(`#call` 内等)で複数の子を `render` で連ねるときはブロックの
戻り値しか使われないため `safe_join([...])` で連結する(ERBでは出力バッファが連結するため不要)。

- バリアント値は Symbol / String 両方を受け付ける。契約に存在しない値は `ArgumentError`(fail-fast)
- `class:` で渡した追加クラスは `tailwind_merge` により契約クラスと統合される(利用者の上書きが後勝ち)
- テーマのカスタマイズは CSS変数の上書きが唯一の公式経路(`@import` より後に書く)

## 開発

```bash
mise install          # ruby 4.0 / node LTS / pnpm
bundle install
pnpm -C tools/extractor install

bundle exec rspec                      # 全テスト(層1/2/3/4)
bundle exec rspec spec/conformance     # 適合試験のみ(追従PRで最初に見る)
bundle exec rspec spec/system          # ふるまいのみ(Cuprite + Chrome)
bundle exec srb tc                     # 型検査
bundle exec rubocop                    # lint
mise run lookbook                      # プレビュー(http://localhost:9292/lookbook)
mise run build-css                     # Lookbook用の静的スタイル再生成
```

Lookbook のプレビューツールバーには **Theme トグルボタン(月/太陽アイコン)** があり、プレビューの
ライト/ダークを切り替えられる(選択はクッキーに永続化)。反映は dummy レイアウト
(`spec/dummy/app/views/layouts/application.html.erb`)が `<html class="dark">` として行う。
ボタンは Lookbook の display option「theme」(select)のテンプレートを差し替えたもので
(`spec/dummy/config/initializers/lookbook_theme_toggle.rb` 参照)、動作経路は Lookbook 組み込みのままである。

### 生成パイプライン

```
rake shadcn:sync      # upstream レジストリを取得 → vendor/shadcn/(ネットワーク使用)
rake shadcn:generate  # vendor から契約JSON + Ruby + CSS を生成(オフライン)
rake shadcn:update    # sync + generate(追従作業のフルセット)
rake shadcn:check     # 決定論性検証(一時ディレクトリ生成とコミット済み生成物のバイト比較)
```

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

`.github/workflows/upstream-drift.yml` が毎週月曜 09:00 JST に `rake shadcn:update` を実行し、差分があれば自動PR(`chore/upstream-sync`)を作成する。人間の仕事はPRのレビューと、赤い場合(適合試験が崩れた場合)の修正のみ。手動実行は workflow_dispatch から。

### 見た目のupstreamパリティ検証(visual parity)

各コンポーネントの見た目が元のshadcn/ui実装(vendor/shadcn のReact実装)と一致するかをピクセル比較で機械判定する仕組み。契約による「クラス文字列の一致」、コンポーネントspecによる「DOM構造の一致」の先にある最終段(「CSS適用結果を含めた見た目の一致」)を検証する。

```bash
bundle exec rake parity:run                      # または mise run parity(ハーネスを明示的に再ビルド)
PARITY_RATIO=0.01 bundle exec rake parity:run    # 閾値を1%に緩和(既定 0.5%)
```

仕組み: `vendor/shadcn` の tsx を `tools/visual-parity` で展開し、Vite + React で実際に描画(upstream側)。dummy の Lookbook プレビュー(うち側)と同じ Chromium(Cuprite)でスクリーンショットを撮り、pixelmatch で差分率を判定する。両側でアニメーションを停止し、同一ブラウザ・同一フォントで比較するため決定論的。各シナリオは **light/dark 両カラースキーム**で撮影する(dark は両側の `<html>` に `.dark` を付与。`dark:bg-destructive/60` 等の dark時ユーティリティや `.dark` トークンの差分はこのモードでしか検出できない)。

さらにアニメーションパリティ(`spec/visual/animation_parity_spec.rb`)では、両側のコンポーネントを開いた直後に WAAPI でアニメーションを取得・停止し、currentTime を同一チェックポイント(0/25/50/75/100%)に固定した上で補間値(opacity / transform / 高さ)とアニメーション名・持続時間・イージングを比較する。時間を仮想化するため実行タイミングに影響されない(drawer は upstream が vaul のJSバネ物理で動くため対象外)。

- 素の `bundle exec rspec` でも**常時実行される**。upstream参照サーバ(vite preview)のキャッシュビルドと起動・停止は `spec/support/parity_server.rb` が自動で行う(ビルド入力のハッシュが変わらなければ再ビルドを省略)。明示的に外したいときだけ `PARITY=0 bundle exec rspec`
- CI でも必須ジョブ(`parity`)として実行される
- 成果物は `spec/visual/baselines/<demo>/<light|dark>/`(ours.png / upstream.png / diff.png / report.json)。Commitして人間が差分画像を確認できる
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
