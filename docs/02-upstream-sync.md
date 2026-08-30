# 02 — upstream 同期（ベンダースナップショット）

- ステータス: **Current**（現行実装の保守者向け設計資料）
- 対象読者: コントリビューター全員、ドリフトPRのレビュアー
- 関連ドキュメント: [00-overview](00-overview.md) / [03-extraction-codegen](03-extraction-codegen.md) / [09-ci-drift-detection](09-ci-drift-detection.md)

---

## 1. 目的と背景

shadcn/ui のコンポーネントは**個別にバージョニングされていない**。公開レジストリ
（`https://ui.shadcn.com/r/...`）は取得時点の最新を常に返す。この性質に対して、次を成立させる仕組みが必要である:

1. **再現性**: 同じ状態から何度生成しても同じ結果が得られる（決定論性の錨）
2. **出所の明示**: 今の `vendor/` が upstream のどの時点なのかを機械可読に記録する
3. **差分の可視化**: upstream が変わったとき、変更内容をレビュー可能な形で持ってくる

採用する解は **コミットされたベンダースナップショット + コンテンツハッシュによる事実上のロックファイル** である。
npmの `package-lock.json` と同様、「シンボリックなバージョン」が存在しない世界では
「取得したコンテンツのハッシュ集合」そのものがロックの正体になる。

## 2. 同期の対象

| 項目 | 値 |
|---|---|
| upstream | `shadcn-ui/ui` が `ui.shadcn.com` 経由で配信するレジストリ |
| スタイル | `base-nova`(upstream現行デフォルト。2026-08-29に`new-york-v4`から移行——公式docs/CLI既定プリセットの移行に追従。`new-york-v4`はCLIの`FALLBACK_STYLE`としてレガシー配信に残る)。base-novaは依存をアイテム毎でなくスタイル共通で宣言する等の形状差があり、sync実装とmanifestスキーマ(§4)で吸収する |
| アイテム種別 | `registry:ui`（UIコンポーネント）。`registry:hook` 等は Ruby相当がないため**対象外**とし、必要になった時点で決定ログを更新 |
| 取得単位 | レジストリインデックス（`https://ui.shadcn.com/r/index.json`）に列挙される全 `registry:ui` アイテム |

補記: アイテムの列挙方法・URLはupstreamのレジストリ進化（2026年3月CLI v4、公開API `shadcn/registry` の提供等）で
変わりうる。sync実装は **インデックス取得 → アイテム取得** の2段階に分離しておき、
URL構造の変更が同期コードの一点に閉じるようにする（[03-extraction-codegen](03-extraction-codegen.md) §2 の `fetch.ts`）。

## 3. vendor スナップショットの構造

```
vendor/shadcn/
├── manifest.json
└── registry/
    └── items/
        ├── accordion.json     # upstreamレジストリアイテム1件分の生JSON（内容は非整形で保存しない → §4 規則5）
        ├── alert.json
        ├── button.json
        └── ...
```

- アイテムJSONは **upstreamが返した生レスポンスを正規化して保存** する（正規化規則は §4）。
  生のまま保存しないのは、キー順等の非本質的差分でPRが汚れるのを防ぐため
- ファイル名 = アイテム名（レジストリの `name` フィールド）。kebab-caseをそのまま維持

## 4. manifest スキーマ

```json
{
  "version": 2,
  "source": {
    "style": "base-nova",
    "registry_base_url": "https://ui.shadcn.com/r",
    "registry_snapshot": {
      "consistency": "double-fetch",
      "index_path": "registry/index.json",
      "index_sha256": "8f52...",
      "style_path": "registry/styles/base-nova/index.json",
      "style_sha256": "35a1...",
      "content_sha256": "4be1..."
    },
    "upstream_release": {
      "tag": "v4.19.0",
      "resolved_sha": "9f31c2e...",
      "checked_at": "2026-08-27T09:00:00Z"
    },
    "tailwind_css": {
      "package": "shadcn",
      "version": "4.19.0",
      "path": "style/tailwind.css",
      "sha256": "bc7d..."
    }
  },
  "fetched_at": "2026-08-27T09:00:12Z",
  "items": {
    "button": {
      "path": "registry/items/button.json",
      "sha256": "5a1d...（アイテムJSON正規化後のSHA256）",
      "file_count": 1,
      "registry_dependencies": ["utils"]
    }
  }
}
```

規則:

1. `source.registry_snapshot` がlive registryのロックを表す。`index_sha256` と
   `style_sha256` は保存した正規化response、`content_sha256` はindex、style bootstrap、
   全remote item、themeを名前付き・キー順固定のJSONへまとめたSHA256である。
   `consistency: double-fetch` は同期の前後で同じ集合hashを観測した場合だけ確定したことを表す
2. `upstream_release` は**出所の参考情報**。GitHub APIで当該時点の最新releaseタグを解決して記録する。
   レジストリ配信内容とreleaseタグの厳密な一致は保証されない（mainブランチ由来の配信がありうる）ため、
   `resolved_sha` をregistry revisionとはみなさない。release情報は同期の前後で一致を確認する
3. `source.tailwind_css` は npm shadcn パッケージ同梱の `tailwind.css`(index.json の
   `@import "shadcn/tailwind.css"` の実体。カスタムバリアント・scroll-fade・shimmer 等の
   スタイル共通定義)のスナップショット。バージョンは `upstream_release.tag` に固定し、
   unpkg の不変URLから取得する。release解決またはCSS取得に失敗した同期は全体を中止し、
   以前のCSSを新しいregistry内容へ流用しない
4. `fetched_at` / `checked_at` は対応するcontent hash / release SHAが変わった場合だけ更新する。
   **契約JSON等の他の生成物にタイムスタンプを入れない**
   （冪等性の要件。詳細は [03-extraction-codegen](03-extraction-codegen.md) §7）
5. `items` のキーはアイテム名でソートする。local overrideのSHAは保存byteそのものに対して計算する
6. manifestの `version` はこのスキーマ自体のバージョン。破壊的変更時はインクリメント
7. upstreamアイテムJSONの正規化: `JSON.stringify(parsed, null, 2)` + LF + 末尾改行 + キー順はパース順維持
   （ソートしない。upstreamのスキーマ順を保存する方がデバッグに有利なため。manifestのキーのみソート）

## 5. rake タスク仕様

すべてのタスクの実体は `tools/extractor` のCLI呼び出しであり、RakeはRuby側のI/Fを提供する。

### 5.1 `rake shadcn:sync`

```
用途:   upstreamの最新レジストリを取得し vendor/shadcn/ を更新する
引数:   REF=r4.19.0 のような指定はしない（レジストリはref指定取得に対応しないため）。
        常に「現時点の最新」を取得し、manifestに出所を記録する
動作:
  1. GitHub APIの最新release、registry index、全 registry:ui item、theme、style bootstrap、
     exact release versionのTailwind CSSを追跡中directoryへ書かず取得・schema検証する
  2. registry一式とrelease metadataを再取得し、集合hashとtag / SHAが一致することを確認する
  3. 完成形をvendorと同じfilesystem上のstaging directoryへ書き、manifestから全checksumを検証する
  4. local overrideが同期中に変わっていないことを確定直前に確認する
  5. 現snapshotをbackup名へ移し、backup側のoverrideを再確認してからstagingをdirectory単位で
     確定する。不一致または確定失敗時はbackupを元のパスへ復元する
  6. 二回の完全なindexから消えたitemだけを廃止とし、差分サマリを標準出力に表示:
     - 新規/削除/変更されたアイテムの一覧
     - 変更アイテムは `git diff --stat vendor/shadcn/` を提示
失敗:  404、通信、JSON、schema、metadata、filesystem、確定失敗は非ゼロexit。
       `[sync:<種別>] retryable=<true|false>` を標準エラーへ出し、**既存snapshotを変更しない**
```

必須成果物の欠損は許容しない。index掲載itemの404をskipしたり、style依存を空配列へ置換したり、
以前のTailwind CSSを流用したりすると異なる取得時点が混在するためである。`files` を持たない
正当なregistry metadata itemと、local overrideが0件である状態だけは許容する。Nodeのportableな
filesystem APIでは非空directory同士を1 syscallで交換できないため、確定はbackup付きrenameと
失敗時rollbackで行う。プロセス自体がrename間で終了した場合も、次回同期開始時に固定名backupを
元のパスへ戻し、未確定staging directoryを除去してから再試行する。同じworktreeに対するsyncは
単一writerとして実行する（GitHub Actionsの各checkoutは独立）。

### 5.2 `rake shadcn:extract`

```
用途:   vendor スナップショットから契約JSONを生成する（gen/contracts/）
入力:   vendor/shadcn/ のみ（ネットワーク不使用）
動作:   各アイテムのTSXをAST解析し、契約スキーマに従うJSONを正規化して出力
失敗:   解析不能なアイテムがあれば非ゼイ exit + アイテム名と解析エラーの詳細
       （= upstreamが新しい構文を採用した場合の最初の検知点）
```

### 5.3 `rake shadcn:generate`

```
用途:   契約JSONからRuby（lib/shadcn_view_components/generated/）と
        CSS（app/assets/stylesheets/shadcn/shadcn.css）を生成する
動作:   5.2 を内部で実行した後、emit処理を実行
備考:   実運用では `shadcn:generate` が extract を含むため、単独で extract を叩くのは
        抽出器のデバッグ時のみ
```

### 5.4 `rake shadcn:update`

```
用途:   sync + generate の一括実行（= 追従作業のフルセット）
用途例: 週次CI / 手動追従
```

### 5.5 `rake shadcn:check`

```
用途:   決定論性の検証（CIで実行）
動作:   generate を一時ディレクトリに対して実行し、コミット済み生成物と
        バイト単位で比較。差分があれば非ゼイ exit + 差分一覧
意義:   「生成物が手編集されていない」「パイプラインが非決定論的になっていない」の2点を保証
```

## 6. 同期の運用フロー

### 6.1 通常（週次自動、詳細は [09-ci-drift-detection](09-ci-drift-detection.md)）

```
週次cron → rake shadcn:update → 差分あり?
  ├─ なし → 何もしない（古い自動PRがあれば閉じる）
  └─ あり → 適合試験 + 全テスト実行
        ├─ 緑  → 自動PR作成 "chore(upstream): sync shadcn/ui @ <出所>"
        └─ 赤  → 同じく自動PR作成（CI red のまま）。壊れたコンポーネントの一覧をPR本文に列挙
```

人間の仕事は **PRのレビューと、赤い場合の修正** に限定される。

### 6.2 手動（緊急追従）

```
mise exec -- rake shadcn:update
git diff gen/          # 契約差分を確認
bundle exec rspec spec/conformance   # 影響確認
# 修正が必要なら app/components 側を修正してPR
```

### 6.3 取得アイテムの追加（初回・コンポーネント新設時）

新コンポーネントを実装する際は、まず sync 対象にアイテムが含まれているかを確認する。
インデックスに存在しない場合（upstream未採用の自作コンポーネント等）は、
`vendor/shadcn/overrides/items/<name>.json` に**自前のレジストリアイテム形式**で置くことを許容する
（契約パイプラインを通すことで適合試験の恩恵を等しく受けるため）。
この場合 manifest の `items.<name>` に `"origin": "local-override"` を記録し、
upstreamに同名アイテムが現れたときに sync が警告を出すようにする。

override の中身には2種類ある。**逐語コピー型**（upstreamの過去スタイルのソースをそのまま
保存したもの。base-nova移行時の旧 `form` が該当）と、**独自契約型**（本リポジトリが
独自に設計したコンポーネントソース。Extractorの解析規約 — `cva`/`cn`/`data-slot` — に
沿って書く必要がある）である。2026-08-29のform再設計（Issue #3）以降、`form` は
独自契約型（Fieldベース・2 exports）に移行した。`direction` は手書きコンポーネントの
ままだが、便宜上 re-export ラッパーの逐語コピーを override として置いている。

## 7. refポリシーと「バージョン」の扱い

- upstreamコンポーネントにはバージョンがないため、**本gemのバージョンは独自semver** を持つ
  （開発中は0.x、API安定後に1.0。詳細は [09-ci-drift-detection](09-ci-drift-detection.md) §6）
- 「どのupstream時点に追従しているか」の答えは常に **manifest.json** のみ。
  CHANGELOGの各リリースに、対応する `upstream_release.tag` / `resolved_sha` と
  vendor差分サマリを記録して人が追えるようにする
- **前方固定はしない**: syncは常に最新を取得する。特定時点に戻す必要が生じた場合は
  git履歴の `vendor/` を checkout して `rake shadcn:generate` すればその時点の生成物が完全に再現される
  （これがスナップショット方式の最大の利点）

## 8. リスクと対策

| リスク | 影響 | 対策 |
|---|---|---|
| レジストリURL/形式の変更 | syncが失敗する | URL構造を `fetch.ts` に集約。失敗は週次CIで即検知。公式公開API（`shadcn/registry`）への移行も視野 |
| アイテムの廃止 | 提供コンポーネントが宙に浮く | syncが削除を警告。deprecation期間を設けてgemのマイナーリリースで廃止（[09](09-ci-drift-detection.md) §6） |
| アイテムのリネーム | 同上 | 削除+新規として検知。エイリアス対応は `04-component-conventions` の命名表で手動管理 |
| upstreamの新構文（AST解析不能） | extractが失敗 | 非ゼイexitで検知。抽出器のアップデートは影響範囲が契約JSONに限定されるため修正は局所的 |
| レジストリ配信の一時障害 | 週次ジョブが失敗 | CIのリトライ + 失敗通知。手動dispatchで再実行 |
| 大量の同時変更（破壊的リニューアル） | 自動PRが巨大化しレビュー困難 | この場合はPRを分割せず「メジャーバージョンアップ」として扱う運用ルールを [09](09-ci-drift-detection.md) §5 に定義 |
