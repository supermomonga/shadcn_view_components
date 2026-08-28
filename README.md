# shadcn_view_components

[shadcn/ui](https://ui.shadcn.com/)(new-york-v4 スタイル)を [Rails ViewComponent](https://viewcomponent.org/) + Stimulus として移植する Rails エンジンgem。

単なる一回の移植ではなく、**shadcn/ui のバージョンアップへの追従コストを最小化する**ことを第一の設計目標とする:

1. **決定論的な生成パイプライン** — upstream レジストリから機械的に導出できるもの(クラス文字列・バリアント定義・`data-slot` 構造・CSS変数)はすべて自動抽出・自動生成し、コミットされた生成物として扱う
2. **自動的な乖離検知** — upstream が変わった際に、適合試験(conformance tests)が互換性の崩れを自動検出する
3. **型付きコードベース** — Sorbet(`typed: strict`)による静的型検査を全面採用

クライアントサイドのふるまいは React/Radix を持ち込まず、**Stimulus + Hotwire + ネイティブHTML要素**による Rails 流の再実装。クラス名・`data-slot`・ARIA属性といった「見た目と構造の契約」は upstream 由来の生成物として維持されるため、視覚的な追従は自動化される。

設計の詳細は `docs.local/` の計画書群(00〜10)を参照。

## ステータス

Phase 0〜3(インフラ、表示のみ、フォーム部品、オーバーレイ・メニュー系)が完了。ロードマップは `docs.local/10-roadmap.md` 参照。

- 提供コンポーネント(26アイテム / 全エクスポートが適合試験で検証済み):
  **Button, Badge, Alert, Card, Avatar, Separator, Skeleton, Table, Label, Kbd, Spinner,
  Empty, AspectRatio, Item, Marker, Input, Textarea, Breadcrumb,
  Accordion, Checkbox, Collapsible, RadioGroup, ScrollArea, Switch, Toggle, ToggleGroup,
  Tabs, Carousel, Pagination, Form,
  Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Tooltip,
  DropdownMenu, ContextMenu, Menubar, NavigationMenu, Command, Combobox, Resizable**
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
cd spec/dummy && bundle exec rails lookbook:server  # プレビュー(dummy経由)
```

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

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| スタイルがまったく当たらない | `@source` 未指定 | インストーラを再実行 |
| ダークモードが効かない | `.dark` の付与先が `<html>` 以外 | `<html class="dark">` に付与 |
| 変数を上書きしたのに反映されない | 上書き位置が `@import` より前 | importより後に書く |
| クラスの競合が意図どおりに解決されない | `tailwind_merge` gemのバージョン差 | issueで報告 |

## ライセンス

MIT
