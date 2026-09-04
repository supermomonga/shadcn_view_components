# 00 — プロジェクト概要

- ステータス: **Current**（現行実装の保守者向け設計資料）
- 対象読者: 本リポジトリのコントリビューター全員
- 関連ドキュメント: [01-architecture](architecture.md) / [02-upstream-sync](upstream-sync.md) / [03-extraction-codegen](extraction-codegen.md) / [09-ci-drift-detection](ci-drift-detection.md) / [10-roadmap](../history/initial-roadmap.md)

---

## 1. プロジェクトの目的

[shadcn/ui](https://ui.shadcn.com/)（vendor manifestで63アイテム、React + Tailwind v4 + Radix/Base UI）を、
[Rails ViewComponent](https://viewcomponent.org/) として移植したライブラリ **`shadcn_view_components`** を構築する。

単なる一回の移植ではなく、**shadcn/ui のバージョンアップへの追従コストを最小化する**ことを第一の設計目標とする。
そのために:

1. **決定論的な生成パイプライン**: shadcn/ui のソース（レジストリJSON）から、機械的に導出できるもの
   （クラス文字列、バリアント定義、`data-slot` 構造、CSS変数、キーフレーム等の「契約データ」）はすべて
   自動抽出・自動生成し、コミットされた生成物として扱う。
2. **自動的な乖離検知**: upstream が変わった際に、生成物の差分と適合試験（conformance tests）によって
   互換性の崩れを自動検出し、週次の自動PRで人間のレビューのみで追従できる状態を作る。
3. **型付きコードベース**: `app/`・`lib/`をSorbet（`typed: strict`）で型検査し、CIで常時検証する。

移植にあたって、クライアントサイドのふるまい（dialog の開閉、メニューのキーボード操作等）は
React/Radix を持ち込まず、**Stimulus + Hotwire + ネイティブHTML要素（`<dialog>`、Popover API、`<details>` 等）
による Rails 流の再実装**とする。クラス名・`data-slot`・ARIA属性といった「見た目と構造の契約」は upstream 由来の
生成物として維持するため、視覚的な追従は自動化される。

## 2. ゴール / ノンゴール

### ゴール

- vendor manifestの63アイテムを追跡し、実装済み61アイテムをViewComponent + Stimulusで提供する
- `questionnaire`と`toast`は理由付き非対応としてconformance registryで明示する（[非対応コンポーネントと代替](../guides/unsupported-components.md)）
- upstream のクラス変更・テーマ変更が **`rake shadcn:sync && rake shadcn:generate` の再実行のみ**で反映される
- upstream 変更による互換性の崩れが適合試験により自動検知され、週次の自動PRとして届く
- ホストアプリは gem 追加 + CSS import + JS 登録の少ない手順で利用開始できる
- すべての Ruby コードが `typed: strict` で書かれ、`srb tc` が CI で常時緑である
- Lookbook によるプレビューと、Cuprite によるシステムスペックでふるまいを検証する

### ノンゴール（明示的にやらないこと）

- **React/Radix/Base UI の JS を配布・同梱しない** — ふるまいは Stimulus + ネイティブ要素で再実装する
- **Tailwind CSS v3 をサポートしない** — upstream が v4 CSS-first に移行済みのため、v4 のみ（[06-theming-tailwind](theming-tailwind.md)）
- **shadcn CLI（`npx shadcn add`）との互換を目指さない** — 配布形態はエンジンgemであり、ソースコピー方式を提供しない
  （shadcn-svelte / shadcn-vue が独自CLI + レジストリ互換で解決している問題領域を、gem という別解で解く）
- **ホストアプリのコードを書き換えない** — マジックを排し、明示的な import / 登録手順とする
- **ブラウザ/Node のビルドツールチェーンをホストに要求しない** — JS はビルドレスの素の ESM で配布する

## 3. 用語定義

| 用語 | 定義 |
|---|---|
| **upstream** | shadcn/ui 本体（`shadcn-ui/ui` リポジトリおよび `ui.shadcn.com` で配信されるレジストリ）。コンポーネント自体は個別バージョニングされず、取得時点の最新が配信される |
| **レジストリアイテム** | upstream が配信するコンポーネント定義JSON。`files[].content` に TSX ソース、`cssVars` / `css` にテーマ情報、`registryDependencies` に依存を含む |
| **vendor スナップショット** | `vendor/shadcn/` に保存した upstream レジストリアイテムの生データ + manifest。抽出器の唯一の入力（[02-upstream-sync](upstream-sync.md)） |
| **契約 (contract)** | vendor スナップショットから抽出した、本ライブラリが守るべき構造的約束。クラス文字列（バリアント別）、`data-slot` 一覧、CSS変数、キーフレーム等。`gen/contracts/*.json` として保存（[03-extraction-codegen](extraction-codegen.md)） |
| **適合試験 (conformance test)** | レンダリング結果のクラス列・`data-slot` が契約と一致することを検証する自動テスト（[07-testing](testing.md)） |
| **生成物** | 抽出器・コード生成器が出力するファイル群。`gen/contracts/`、`lib/shadcn_view_components/generated/`、`app/assets/stylesheets/shadcn/shadcn.css`。すべてコミットされ、機械生成であることがヘッダで明示される |
| **ドリフト** | upstream の変更と本ライブラリ実装の乖離 |

## 4. 全体データフロー

```
 ┌─────────────────┐
 │  shadcn/ui      │  ui.shadcn.com レジストリ (base-nova スタイル)
 │  (upstream)     │  ※個別バージョニングなし = 常に最新が配信される
 └────────┬────────┘
          │ rake shadcn:sync   … 週次CI / 手動
          ▼
 ┌─────────────────┐
 │ vendor/shadcn/  │  ★コミットされたスナップショット（決定論性の錨）
 │  + manifest.json│  … 取得日時・各アイテムのSHA256・出所ref
 └────────┬────────┘
          │ tools/extractor (Node + TypeScript + Babel AST)
          │ rake shadcn:extract / shadcn:generate
          ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 生成物（★コミット、レビュー可能な差分）                       │
 │  gen/contracts/<name>.json          契約データ（中間表現）   │
 │  lib/shadcn_view_components/        Rubyクラスマップ        │
 │    generated/contracts/<name>.rb    (typed: strict)        │
 │  app/assets/stylesheets/            テーマCSS               │
 │    shadcn/shadcn.css                (oklch変数/keyframes)  │
 └────────┬────────────────────────────────────────────────┘
          │ 参照（ランタイム）
          ▼
 ┌─────────────────┐     ┌───────────────────────────────┐
 │ app/components/ │     │ app/assets/javascripts/shadcn/ │
 │ shadcn/*.rb     │     │ Stimulusコントローラ(手書きESM)  │
 │ (手書き・構造)    │     │ (手書き・ふるまい)               │
 └────────┬────────┘     └──────────────┬────────────────┘
          │ レンダリング                  │ data-controller
          ▼                             ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 適合試験 (spec/conformance)                              │
 │  レンダリングHTMLのクラス列・data-slot ≒ 契約JSON           │
 │  → upstream変更で契約が変わればここで自動的に赤くなる          │
 └─────────────────────────────────────────────────────────┘
```

ポイント:

- **vendor スナップショットが決定論性の錨**。抽出器はネットワークにアクセスせず vendored ファイルのみを読む。
  したがって「同一スナップショットからは常に同一の生成物」が得られる（冪等性は `rake shadcn:check` でCI検証）。
- **手書き領域は構造（ERB）とふるまい（Stimulus）のみ**。クラス定義を手書きしない。
- upstream のクラス変更は「sync → generate」の再実行で自動反映され、構造に影響する変更
  （`data-slot` の増減、バリアントの追加など）は適合試験の失敗として表面化する。

## 5. 設計判断

採用理由、検討した選択肢、結果、再評価条件は[ADR一覧](../adr/README.md)を正本とする。この文書には現在の構成と指標だけを記載し、判断の履歴を重複管理しない。

主要な判断:

- [ADR 2](../adr/0002-classify-questionnaire-and-toast-as-intentionally-unsupported.md): `questionnaire`と`toast`を理由付き非対応に分類する
- [ADR 3](../adr/0003-package-components-as-a-rails-engine-gem.md): Rails Engine gemとして配布する
- [ADR 4](../adr/0004-vendor-the-upstream-registry-as-hashed-snapshots.md)〜[ADR 6](../adr/0006-parse-tsx-and-pre-resolve-classes-with-upstream-javascript-libraries.md): upstream固定、生成領域、抽出・事前解決の境界
- [ADR 7](../adr/0007-map-upstream-exports-to-explicit-viewcomponent-apis.md)〜[ADR 10](../adr/0010-publish-one-esm-interface-for-importmap-and-bundler-hosts.md): ViewComponent API、ブラウザ動作、CSS、JavaScript配布
- [ADR 11](../adr/0011-type-runtime-ruby-with-sorbet-strict.md)〜[ADR 13](../adr/0013-track-upstream-weekly-and-version-the-gem-independently.md): 型検査、検証、upstream追従とバージョニング
- [ADR 14](../adr/0014-follow-the-base-nova-registry-style.md)〜[ADR 17](../adr/0017-keep-chart-rendering-library-independent.md): `base-nova`、Form、Direction、Chartの個別境界

## 6. 成功指標

| 指標 | 目標 |
|---|---|
| upstream追従の手作業 | 週次自動PRの**レビューのみ**（コード修正は適合試験が導く差分に対するものだけ） |
| 追従リードタイミング | upstream変更検知から自動PR作成まで **1週間以内**（週次cron） |
| 生成の冪等性 | `rake shadcn:check` が常に `git diff --exit-code` で成功 |
| 型検査 | `app/`・`lib/`に対する`srb tc`エラーゼロ |
| 適合試験カバレッジ | 提供コンポーネントのバリアント組み合わせ 100%（契約から自動生成） |

## 7. ドキュメントマップ

| ファイル | 内容 |
|---|---|
| [overview.md](overview.md) | 本書。ゴール/ノンゴール、用語、主要ADRへの案内 |
| [architecture.md](architecture.md) | リポジトリ構成、エンジン設計、レイヤー依存規則 |
| [upstream-sync.md](upstream-sync.md) | vendor スナップショット、manifest、rakeタスク仕様 |
| [extraction-codegen.md](extraction-codegen.md) | 抽出器仕様、契約JSONスキーマ、コード生成、決定論性規則 |
| [component-conventions.md](component-conventions.md) | 命名、prop→kwarg対応、slots、属性マージ、実装テンプレート |
| [stimulus-hotwire.md](stimulus-hotwire.md) | コントローラ規約、ネイティブ要素使い分け、ARIAチェックリスト、Turbo統合 |
| [theming-tailwind.md](theming-tailwind.md) | Tailwind v4、テーマCSS生成、ホストへのインストール手順 |
| [testing.md](testing.md) | RSpec構成、適合試験設計、Cupriteシステムスペック、Lookbook |
| [sorbet.md](sorbet.md) | typed: strictポリシー、tapioca運用、生成物のsig |
| [ci-drift-detection.md](ci-drift-detection.md) | CI構成、週次ドリフトワークフロー、自動PR、リリースフロー |
| [../history/initial-roadmap.md](../history/initial-roadmap.md) | 完了済みPhase 0〜4のコンポーネント割当、依存順序、完了条件（履歴） |
