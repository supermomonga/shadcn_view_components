# 00 — プロジェクト概要

- ステータス: **Current**（現行実装の保守者向け設計資料）
- 対象読者: 本リポジトリのコントリビューター全員
- 関連ドキュメント: [01-architecture](01-architecture.md) / [02-upstream-sync](02-upstream-sync.md) / [03-extraction-codegen](03-extraction-codegen.md) / [09-ci-drift-detection](09-ci-drift-detection.md) / [10-roadmap](10-roadmap.md)

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
- `questionnaire`と`toast`は理由付き非対応としてconformance registryで明示する（[非対応コンポーネントと代替](unsupported-components.md)）
- upstream のクラス変更・テーマ変更が **`rake shadcn:sync && rake shadcn:generate` の再実行のみ**で反映される
- upstream 変更による互換性の崩れが適合試験により自動検知され、週次の自動PRとして届く
- ホストアプリは gem 追加 + CSS import + JS 登録の少ない手順で利用開始できる
- すべての Ruby コードが `typed: strict` で書かれ、`srb tc` が CI で常時緑である
- Lookbook によるプレビューと、Cuprite によるシステムスペックでふるまいを検証する

### ノンゴール（明示的にやらないこと）

- **React/Radix/Base UI の JS を配布・同梱しない** — ふるまいは Stimulus + ネイティブ要素で再実装する
- **Tailwind CSS v3 をサポートしない** — upstream が v4 CSS-first に移行済みのため、v4 のみ（[06-theming-tailwind](06-theming-tailwind.md)）
- **shadcn CLI（`npx shadcn add`）との互換を目指さない** — 配布形態はエンジンgemであり、ソースコピー方式を提供しない
  （shadcn-svelte / shadcn-vue が独自CLI + レジストリ互換で解決している問題領域を、gem という別解で解く）
- **ホストアプリのコードを書き換えない** — マジックを排し、明示的な import / 登録手順とする
- **ブラウザ/Node のビルドツールチェーンをホストに要求しない** — JS はビルドレスの素の ESM で配布する

## 3. 用語定義

| 用語 | 定義 |
|---|---|
| **upstream** | shadcn/ui 本体（`shadcn-ui/ui` リポジトリおよび `ui.shadcn.com` で配信されるレジストリ）。コンポーネント自体は個別バージョニングされず、取得時点の最新が配信される |
| **レジストリアイテム** | upstream が配信するコンポーネント定義JSON。`files[].content` に TSX ソース、`cssVars` / `css` にテーマ情報、`registryDependencies` に依存を含む |
| **vendor スナップショット** | `vendor/shadcn/` に保存した upstream レジストリアイテムの生データ + manifest。抽出器の唯一の入力（[02-upstream-sync](02-upstream-sync.md)） |
| **契約 (contract)** | vendor スナップショットから抽出した、本ライブラリが守るべき構造的約束。クラス文字列（バリアント別）、`data-slot` 一覧、CSS変数、キーフレーム等。`gen/contracts/*.json` として保存（[03-extraction-codegen](03-extraction-codegen.md)） |
| **適合試験 (conformance test)** | レンダリング結果のクラス列・`data-slot` が契約と一致することを検証する自動テスト（[07-testing](07-testing.md)） |
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

## 5. 決定ログ（2026-08-27 ヒアリングにて確定）

| # | 決定事項 | 選択 | 主な理由 |
|---|---|---|---|
| 1 | コンポーネントスコープ | manifest 63件を追跡、61件実装、2件は理由付き非対応 | `questionnaire`と`toast`を理由・代替・対象SHA付きの`unsupported`としてregistryで機械検証 |
| 2 | 生成アーキテクチャ | 抽出 + 手書きテンプレ + 自動検証のハイブリッド | TSX→Rubyの全自动翻訳は非現実的な脆さを持つ。機械導出可能な領域に「決定論的生成」を限定する |
| 3 | upstreamの固定方法 | ベンダースナップショット（コミット） | submoduleはリポジトリが巨大、都度フェッチは決定論性を壊す。コミットされたスナップショットが最もシンプルでレビュー可能 |
| 4 | 配布形式 | Railsエンジンgem | ViewComponent・Stimulus・CSSを一元管理し、ホストの手数を最小化する |
| 5 | JS挙動の設計思想 | Rails流ネイティブ最優先 | `<dialog>`・Popover API等のネイティブ要素とTurboとの相性を最優先。Radixの細部再現は二次的（[05-stimulus-hotwire](05-stimulus-hotwire.md)） |
| 6 | サポートmatrix | Ruby 4.0+ / Rails 8.1+ | 新規プロジェクトであり現行最新のみ対象とし保守コストを最小化 |
| 7 | テストスタック | RSpec + Cuprite + Lookbook + visual parity | component・conformance・system・integrity・visualの5層をCIで検証 |
| 8 | ドリフト検知 | 週次cron + 自動PR | 検知の即時性よりPRノイズの少なさを優先。手動dispatchも可能に |
| 9 | Sorbet厳格度 | `app/`・`lib/`を`typed: strict`で検査 | spec/tools等は`sorbet/config`で除外。Tapioca RBIをコミットしCIで検証 |
| 10 | API規約 | `Shadcn::` 名前空間 + prop→kwarg機械対応 | upstreamのprop名との対応規約自体を文書化された契約にする（[04-component-conventions](04-component-conventions.md)） |
| 11 | 設計資料構成 | 領域別フルセット（00〜09 + 履歴roadmap） | 現行設計と初期実装計画の履歴を分離する |
| 12 | 通知（upstream `toast`） | `toast`は移植せず、既存のSonner通知（`Shadcn::Sonner::Toaster` + `shadcn:toast`）を唯一の通知APIとする | base-novaでは`toast`（Base UI専用）が正規だが、本gemは**意図的に差異**を置く。Provider・manager・表示領域が既存Sonner実装と重複し、通知APIの二重保守を避けるため。操作を伴う通知・重要情報は`Shadcn::Alert`へ（[非対応コンポーネントと代替](unsupported-components.md)） |
| 13 | アンケート（upstream `questionnaire`） | 理由付き非対応。Field / Form等の代替と、サーバー主導の複数ステップフロー（1 step = 1リクエスト、422で同一step再描画）を案内する | step・回答・validation・shortcutまで単一の状態機械として所有するupstream実装を、共通要件のないまま独自仕様として保守するとupstream同期の恩恵を失うため。再評価はregistryの`reviewed_sha256`変化または具体的な共通要件の発生時（[非対応コンポーネントと代替](unsupported-components.md)） |

### 補足: ヒアリングで明示的に確認しなかった技術的デフォルト

以下は現在の実装で採用している技術的デフォルトである。変更時は実装と関連文書を同じPRで更新する。

| 項目 | 採用案 | 根拠 |
|---|---|---|
| ソーススタイル | `base-nova` | upstreamの現行デフォルト(2026-08-29に`new-york-v4`から移行)。公式docsは`/docs/components/*`をbaseページへ307リダイレクトし、CLI v4の`init -d`は`--preset=base-nova`。`new-york-v4`はCLIの`FALLBACK_STYLE`(レガシー配信)として残るが本流はbases/(Base UI)。初期計画時は「現行デフォルト=new-york-v4」を採用していたが、本家のデフォルト移行により決定を更新 |
| 抽出器の実装 | Node.js + TypeScript + Babel（`@babel/parser`） | レジストリの `files[].content` はTSX。正規表現解析は脆すぎるためAST解析が必須。NodeはTailwind検証用にローカル開発で必要なため追加コスト小 |
| クラス解決方式 | 抽出時にバリアント組み合わせを列挙し、`cva` + `tailwind-merge` を**Node側で事前解決**した最終文字列を契約に保存 | ランタイムにJSのtailwind-merge相当を再実装しない。Ruby側は単純な文字列連結のみで済む（[03-extraction-codegen](03-extraction-codegen.md) §5） |
| ランタイムのクラスマージ | `tailwind_merge`（Ruby実装）gem を依存に追加 | ホスト/コンポーネント利用者が追加クラスを渡した際の競合解決のため |
| バージョニング | gemは独自semver（開発中0.x）、upstreamの出所はmanifestで追跡 | upstreamコンポーネント自体にバージョンがないため、SHAによる事実上のロックファイル（manifest）で出所を担保 |
| JS配信 | importmap自動pin + bundler向け同期ESM package | importmapではビルドレスで提供し、bundlerではインストーラが同期したlocal dependencyを利用 |
| chart | library非依存のContainer・TooltipContent・LegendContent・Styleを提供 | upstreamのRecharts必須描画とは同一状態を作れないためvisual parity対象外。system/render契約で境界を検証 |
| form の扱い（Issue #3、2026-08-29確定） | **Fieldベースで再設計**（独自契約の local-override を継続） | base-nova は form の配信を終了し、公式 docs/forms は「Field プリミティブ + data-invalid / aria-invalid の手動ワイヤリング」方針。これに沿い、API を `Form::Item`（Field構造 + `invalid:` → `data-invalid`）と `Form::Error`（upstream FieldError 準拠: `message:`/`errors:` → 1件平文・複数ul・空なら非描画）の最小2部品へ刷新。Label/Description は `Shadcn::Field::*` 直用。`Form::Control`/`Form::Message` は廃止（破壊的変更）。レガシー new-york-v4 定義の維持は撤退 |
| direction の扱い（Issue #3、2026-08-29確定） | **現行維持**（local-override のまま） | base-nova の direction は `@base-ui/react` の純粋なre-exportで抽出可能な契約面がなく、現行の手書き `Shadcn::DirectionProvider`（`dir` 属性のみ）で機能的に同等。週次syncのshadow警告は運用で受け入れる。upstream に抽出可能な契約面が現れた時点で再評価 |

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
| [00-overview.md](00-overview.md) | 本書。ゴール/ノンゴール、用語、決定ログ |
| [01-architecture.md](01-architecture.md) | リポジトリ構成、エンジン設計、レイヤー依存規則 |
| [02-upstream-sync.md](02-upstream-sync.md) | vendor スナップショット、manifest、rakeタスク仕様 |
| [03-extraction-codegen.md](03-extraction-codegen.md) | 抽出器仕様、契約JSONスキーマ、コード生成、決定論性規則 |
| [04-component-conventions.md](04-component-conventions.md) | 命名、prop→kwarg対応、slots、属性マージ、実装テンプレート |
| [05-stimulus-hotwire.md](05-stimulus-hotwire.md) | コントローラ規約、ネイティブ要素使い分け、ARIAチェックリスト、Turbo統合 |
| [06-theming-tailwind.md](06-theming-tailwind.md) | Tailwind v4、テーマCSS生成、ホストへのインストール手順 |
| [07-testing.md](07-testing.md) | RSpec構成、適合試験設計、Cupriteシステムスペック、Lookbook |
| [08-sorbet.md](08-sorbet.md) | typed: strictポリシー、tapioca運用、生成物のsig |
| [09-ci-drift-detection.md](09-ci-drift-detection.md) | CI構成、週次ドリフトワークフロー、自動PR、リリースフロー |
| [10-roadmap.md](10-roadmap.md) | 完了済みPhase 0〜4のコンポーネント割当、依存順序、完了条件（履歴） |
