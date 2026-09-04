# 09 — CI とドリフト自動検知

- ステータス: **Current**（現行実装の保守者向け設計資料）
- 対象読者: メンテナー・ドリフトPRのレビュアー
- 関連ドキュメント: [00-overview](overview.md) / [02-upstream-sync](upstream-sync.md) / [03-extraction-codegen](extraction-codegen.md) / [07-testing](testing.md)

---

## 1. ワークフロー構成

```
.github/workflows/
├── ci.yml               # PR/プッシュ時に実行する通常CI
└── upstream-drift.yml   # 週次cron + workflow_dispatch で実行するドリフト検知
```

## 2. ci.yml（通常CI）

トリガー: `pull_request` / `push` to main。

| ジョブ | 内容 | 使用ツール |
|---|---|---|
| `lint-ruby` | `rubocop`（rubocop-sorbet含む。[08-sorbet](sorbet.md) §7） | mise |
| `lint-js` | 抽出器の型検査・Vitestと配布JSのlint・typecheck・DOM/bundle test | mise + pnpm |
| `sorbet` | `srb tc` + `tapioca gem --verify` | mise |
| `rspec` | コンポーネントスペック・適合試験・生成物整合スペック（[07-testing](testing.md) 層1/2/4） | mise |
| `system` | Cupriteシステムスペック（層3）。Chromeのセットアップを含む | browser-actions/setup-chrome |
| `parity` | upstream React/ViteとLookbookの静的・アニメーションparity。失敗成果物をartifactとして保存 | Chrome + pnpm + pixelmatch |
| `determinism` | **`rake verify:generated` → `git diff --exit-code`**。`shadcn:check`に加えてREADME inventoryとcomponent referenceの`docs:check`も実行 | ruby + node |
| `tailwind-build` | ビルド済みgemのEngine統合と全クラス抽出元が実際にTailwindビルドを通るか（[06](theming-tailwind.md) §6） | `tailwindcss-rails` 4.3系 / lock解決版 + node |

- セットアップはmiseで統一（`jdx/mise-action`）。Ruby・Nodeのバージョンは `mise.toml` が単一の真実の源
- **`determinism` は最重要ジョブ**: 「生成物が手編集された」「パイプラインが非決定論化した」の両方を
  検知し、README inventoryとcomponent referenceの更新漏れも同じjobで検知する

## 3. upstream-drift.yml（ドリフト自動検知 — 本ライブラリの目玉）

### 3.1 トリガー

```yaml
on:
  schedule:
    - cron: "0 0 * * 1"    # 毎週月曜 09:00 JST
  workflow_dispatch:        # 手動実行（緊急追従・確認用）
```

### 3.2 処理フロー

```
[1] checkout
[2] mise セットアップ（ruby / node）
[3] rake shadcn:update                 # sync + generate（[02](upstream-sync.md) §5.4）
[4] git status --porcelain --untracked-files=all
    ├─ 差分なし → 既存のupstream-sync PRがあれば close → 正常終了（何も起きない）
    └─ 差分あり ↓
[5] Chrome・Ruby・全pnpm依存を用意し、bundle exec rake verify（8検査）
    └─ 失敗 → workflowを失敗させ、PRは作成しない
[6] 全検査成功時だけdraft PRを作成・更新:
      branch:  chore/upstream-sync
      title:   "chore(upstream): sync shadcn/ui (<manifestの出所情報>)"
      labels:  [upstream-sync, automated]
      body:    §3.3のテンプレート
[7] github.tokenで同じheadのci.ymlをworkflow_dispatchし、8つの必須checkが作成されたことを確認
[8] check作成確認後にdraftをreview readyへ変更
```

PR作成は`peter-evans/create-pull-request`と`github.token`を使用する。専用PATやGitHub App tokenは使用しない。
固定branchによりopenな同期PRは最大1件となり、更新時もいったんdraftへ戻る。

### 3.3 自動PRの本文

`.github/scripts/render_upstream_sync_report.rb`がPR本文とActions summaryを生成する。upstream tag、完全なrelease commit、
registry snapshot hash、取得日時、先行`bundle exec rake verify`の結果とrun URL、全変更、契約差分を記録する。
レビュー手順は契約diff、8つのCI check、削除itemのdeprecation判断に固定している。

### 3.4 失敗時の扱い

| 失敗 | 挙動 |
|---|---|
| sync自体の失敗（ネットワーク・レジストリ形式変更） | ワークフロー赤 + 通知（GitHub通知/Slack連携は設定自由）。PRは作らない |
| extract失敗（AST解析不能） | 同上。この場合抽出器の対応が必要（[03](extraction-codegen.md) §8） |
| `bundle exec rake verify`失敗 | workflowを失敗させ、PRは作成・更新しない。Actions summaryに結果を残す |
| 全検査成功 | draft PRを作成し、通常CIの8 checkが作成されたことを確認してreview readyにする |

先行する全verifyを通過した内容だけをPRにすることで、自動同期PRをレビュー可能な状態に限定する。

## 4. 通知と可視化

- upstream-sync PRは**常に1件まで**（§3.2 [6]）。未対応の追従が溜まっている状態をPRで見える化
- 同期結果・完全なupstream SHA・registry snapshot hash・取得日時・verify結果はPR本文とActions summaryへ記録する
- workflowは`actions: write`で通常CIを明示dispatchし、必須8 checkの作成を最大20回確認する

## 5. 非規範的な運用メモ

この節はworkflowへ未実装の将来案であり、現在の自動処理・必須ルールではない。

### 大規模変更（破壊的リニューアル）の扱い

upstreamが大量の同時変更（デザイン刷新等）を配信した場合:

- 差分が閾値（例: 変更アイテム数が全体的な3分の1超、または適合試験の赤が全体の半分超）を超えたら、
  自動PRのタイトルに `[major]` を付け、**マイナーバージョンでの吸収を諦めてメジャー対応とする**運用ルール
- メジャー対応では、現行スナップショットを維持したリリースブランチ（`maintenance/v0` 等）と、
  新スナップショット追従のmainを分離できる。ただし**スナップショット方式により、任意時点への
  固定はgit履歴から常に再現可能**（[02](upstream-sync.md) §7）であるため、分離コストは低い

## 6. バージョニングとリリースフロー

### 6.1 バージョン体系

- **gemは独自semver**（開発中 `0.x`、API安定後 `1.0`）。upstreamコンポーネントにバージョンがないため、
  upstreamバージョンとの対応は取らない（決定ログ・技術的デフォルト表参照）
- 「どのupstream時点か」は **manifest.jsonが唯一の真実の源**。`ShadcnViewComponents::UPSTREAM` のような
  定数は持たせない（二重管理を避ける。必要時はmanifestを読む）

### 6.2 リリース手順

```
1. 通常開発・upstream-sync PRのマージをmainに蓄積
2. リリース時:
   a. VERSION更新（semver判定は人間:
      - 生成物のみの変更で適合試験緑 → patch
      - Ruby API追加 → minor
      - API破壊的変更・大規模upstream変更 → major）
   b. CHANGELOG.md に以下を記載:
      - このリリースに含まれる upstream-sync の出所（tag / resolved_sha / 日付）
      - upstream差分サマリ（syncサマリのコピペ）
      - gem側のAPI変更
3. タグ付け → `rake release`（rubygems/release-gem等）
```

- CHANGELOGのupstream出所記録により、「このバージョンはshadcn/uiのいつの時点か」が
  gemのバージョン表記なしで完全に追跡できる

### 6.3 廃止（deprecation）ポリシー

- syncがアイテム削除を警告した場合（[02](upstream-sync.md) §5.1 [2]）:
  1. まず該当コンポーネントをdeprecation警告（Rubyの `Kernel#warn` + ドキュメント更新）付きで維持
  2. 最低1マイナーバージョンの猶予後に削除
- upstreamでのリネームは「削除+新規」で検知されるため、同名判定・エイリアス提案は人間が判断して
  命名表（[04](component-conventions.md) §2）に記録する

## 7. セキュリティ

- ワークフロー内の外部アクションはpin（commit SHA指定）
- PR作成トークンは最小権限（§3.2）。`pull_request_target` 是非問題を避け、
  自動PR上では**権限の強いステップを実行しない**（適合試験等は通常のpull_requestトリガーCIで走らせる）
- `vendor/` 取得はHTTPS固定。生成前のZod検証がサプライチェーンのゲート（[03](extraction-codegen.md) §4）
