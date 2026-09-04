# 10 — ロードマップ（Phase 0〜4・履歴）

- ステータス: **Historical**（Phase 0〜4の初期実装計画を保存した履歴資料）
- 対象読者: コントリビューター全員
- 関連ドキュメント: [00-overview](../reference/overview.md) / [05-stimulus-hotwire](../reference/stimulus-hotwire.md) / [09-ci-drift-detection](../reference/ci-drift-detection.md)

---

> この文書は初期実装のフェーズ分割と当時の判断を保存する履歴資料です。Phase 0〜4は完了しており、現在の実装状況は [README](../../README.md) と `spec/coverage/registry.yml` を参照してください。

## 1. フェーズ構成の考え方

初期実装で対象にした61アイテムを、**「依存されるものから」「リスクの低いものから」**の順に5フェーズで投入した。
現在のmanifest・実装済み・pendingの件数は、この履歴資料ではなく[README](../../README.md)と各registryを参照する。
各フェーズには完了条件（DoD）を設け、フェーズ未完了のまま次へ進まない。

```
Phase 0: インフラ（gem雛形・同期・抽出・生成・CI・型・テスト基盤）
Phase 1: 表示のみコンポーネント（〜17個）      … パイプラインの実証
Phase 2: フォーム系・軽インタラクティブ（〜11個） … フォーム統合の確立
Phase 3: オーバーレイ・メニュー系（〜13個）      … ネイティブ活用の本番
Phase 4: 複合・重量コンポーネント（〜8個）      … 個別評価を含む
```

コンポーネント数は初期実装時に対象とした61アイテムを基準にした目安である。
**現在の正確な一覧は常に `vendor/shadcn/manifest.json` が真実の源**であり、
本ドキュメントの割当表は初期計画である。

## 2. Phase 0 — インフラ構築

### スコープ（コンポーネント0個。ただしButton1個をパイプライン実証に使用）

| 作業 | 内容 | ドキュメント |
|---|---|---|
| gem雛形 | gemspec・エンジン・ディレクトリ構成（[01](../reference/architecture.md) §2） | 01 |
| 同期 | `rake shadcn:sync` / manifest（[02](../reference/upstream-sync.md) §5.1） | 02 |
| 抽出器 | Babel AST解析・契約JSON生成（[03](../reference/extraction-codegen.md)）: cva/cn/data-slot/事前解決 | 03 |
| 生成器 | Ruby・CSS出力・正規化（[03](../reference/extraction-codegen.md) §6-7） | 03 |
| BaseComponent | 属性マージ・クラス解決・tag: 差し替え（[04](../reference/component-conventions.md) §5-6） | 04 |
| **Button** | パイプライン実証として実装。適合試験・プレビュー込み | 04/07 |
| CI | ci.yml（determinism含む）+ upstream-drift.yml（[09](../reference/ci-drift-detection.md)） | 09 |
| Sorbet | tapioca・strict全面・CI統合（[08](../reference/sorbet.md)） | 08 |
| テスト基盤 | spec/dummy・Lookbook・Cuprite・conformanceマッチャ（[07](../reference/testing.md)） | 07 |
| インストーラ | `shadcn_view_components:install`（[06](../reference/theming-tailwind.md) §5） | 06 |

### DoD

- [ ] `rake shadcn:update` → `rake shadcn:check` が冪等に成功
- [ ] Buttonの適合試験が全バリアント組み合わせで緑
- [ ] upstreamを模したダミーアイテム（クラス変更済みfixture）で**適合試験が赤になること**を検証
      （= 検知機構そのもののテスト。これがPhase 0の最重要验收項目）
- [ ] `srb tc`・`rubocop`・システムスペック（dialog未実装のため最小）がCIで緑
- [ ] 週次ドリフトワークフローがdry-run（workflow_dispatch）で成功

## 3. Phase 1 — 表示のみコンポーネント（〜17個）

JS不要・`Classes.resolve` とERBのみで完結する群。**量産フェーズ**であり、
ここで「新規コンポーネント追加の最短経路」（[04](../reference/component-conventions.md) §7チェックリスト）を安定させる。

| コンポーネント | 備考 |
|---|---|
| badge, alert, avatar, separator, skeleton, table, label, kbd, spinner, empty, aspect-ratio, typography(Text等), item, marker | 純粋表示 |
| input, textarea | スタイル付きネイティブ要素（見ためのみ。フォーム統合はPhase 2のform） |
| card | 複合コンポーネント規約（ネストクラス）の最初の実装例 |
| breadcrumb | 静的構造（JS不要な範囲） |

### DoD

- [ ] 全コンポーネントが[04](../reference/component-conventions.md) §7チェックリストを満たす
- [ ] 複合（card）のネストクラス適合試験が緑
- [ ] Lookbookに全バリアントのプレビュー
- [ ] 新規コンポーネント1個追加が「契約生成→1ファイル実装→registry.ymlに1行→完了」の経路で30分以内でできることを確認

## 4. Phase 2 — フォーム系・軽インタラクティブ（〜11個）

ネイティブ要素 + `peer-checked` CSS + 小さなStimulusで成立する群。
**Railsフォームとの統合パターンをここで確立**する（`form_with` との併用例・`aria-invalid` 連携の設計）。

| コンポーネント | 実装基盤（[05](../reference/stimulus-hotwire.md) §3） |
|---|---|
| checkbox, switch | `<input type=checkbox>` + CSS（JSレス） |
| radio-group | `<input type=radio>`（JSレス） |
| toggle, toggle-group | button + `data-state` + 小コントローラ（toggle-groupは排他） |
| form | Rails統合層（`aria-invalid`・エラーメッセージ構造）。upstreamのreact-hook-form依存部分はRails流に再解釈 |
| collapsible | `<details>` |
| accordion | `<details name>` 排他 + アニメーション補助 |
| tabs | ARIA tabsパターン + roving tabindex |
| pagination | リンクベース（JSレス） |
| scroll-area | CSSユーティリティ |
| carousel | scroll-snap + ナビ補助 |

### DoD

- [ ] `form_with` と各フォーム部品の統合スペック（値の送出・バリデーションエラー表示）
- [ ] JS無効時フォールバック分類（Graceful/Readable）が全コンポーネントで判定済み（[05](../reference/stimulus-hotwire.md) §5）
- [ ] キーボード操作チェックリスト（[05](../reference/stimulus-hotwire.md) §4）のシステムスペック緑

## 5. Phase 3 — オーバーレイ・メニュー系（〜13個）

`<dialog>` とPopover APIが主戦場。**ネイティブ最優先方針の本番評価**を行うフェーズ。

| コンポーネント | 実装基盤 |
|---|---|
| dialog | `<dialog>` + showModal |
| alert-dialog | `<dialog>` + フォーカス制御 |
| sheet, drawer | `<dialog>` + スライド変形（クラスはupstream契約） |
| popover | Popover API |
| hover-card | Popover API + hover intent |
| tooltip | Popover API + 遅延制御 |
| dropdown-menu | Popover API + ARIA menu + 共通キーボードlib |
| context-menu | 同上（右クリック） |
| menubar | 同上（横断） |
| navigation-menu | 同上 + ナビ構造 |
| command | ARIA combobox/listbox + フィルタlib（検索・グループ・ハイライト） |
| combobox | command + popover の合成（upstream同様の構成） |
| resizable | flex-basis 配分 + ドラッグ（当初の grid 案を変更） |

### DoD

- [ ] 全コンポーネントのキーボード・ARIAシステムスペック緑（APG準拠）
- [ ] Turbo Frame/キャッシュ併用の統合スペック（[05](../reference/stimulus-hotwire.md) §6）緑
- [ ] dialog系の`turbo:submit-end`標準フックの提供とスペック

## 6. Phase 4 — 複合・重量コンポーネント（〜8個・個別評価含む）

| コンポーネント | 方針 |
|---|---|
| sidebar | CSS grid + 状態保持コントローラ。`--sidebar-*` 変数群は契約CSS由来 |
| input-otp | 入力分割コントローラ |
| calendar | 自前月グリッド + i18n。**詳細設計を先にdocsへ起こしてから実装**（週始まり・ロケール・キーボード） |
| date-picker | calendar + popover 合成 |
| sonner（toast代替） | Turbo Streams + flash連携の設計（Rails流の再解釈） |
| chart ※個別評価 | upstreamはrecharts依存。選択肢: (a) SSR SVG生成 (b) Chartkick等既存Rails資産との共存 (c) スコープ外宣言。**Phase 3終了時に決定** |
| data-table ※個別評価 | upstreamはTanStack Table依存。選択肢: (a) サーバーサイドページネーション・ソート（Rails流） (b) 最小限のクライアントソートコントローラ (c) table + ユーザー実装への部品提供のみ。**同時に決定** |
| message / bubble / attachment 等AI系 ※個別評価 | upstreamで `@shadcn/react` パッケージ由来。ViewComponent化の価値を個別判断。不要ならノンゴールとして決定ログに記録 |

### DoD

- [ ] 初期対象61 registry itemsの提供または**明示的なスコープ外宣言**（決定ログ更新）が完了
- [ ] chart/data-tableの決定が文書化されている
- [ ] 1.0リリース判定: API安定・適合試験100%・ドキュメント整備

## 7. 横断タスク（全フェーズ共通）

| タスク | タイミング |
|---|---|
| 週次upstream-sync PRの運用開始 | Phase 0完了直後（Phase 1以降は追従し続ける前提） |
| README・利用ドキュメントの拡充 | Phase 1で初版、各フェーズで更新 |
| `spec/conformance/registry.yml` のpending消化管理 | 各フェーズで棚卸し |
| 決定ログ（[00-overview](../reference/overview.md) §5）の更新 | 技術的デフォルトに変更加えるたび |
| 抽出器のoverrides.json使用状況レビュー | 各フェーズ境界 |

## 8. リスク登録簿（フェーズ横断）

| リスク | 影響フェーズ | 対策 | 参考 |
|---|---|---|---|
| upstreamのTSX新構文で抽出不能 | 全フェーズ | fail-fast + 週次検知 + 抽出器の局所修正 | [03](../reference/extraction-codegen.md) §8 |
| ネイティブ要素でARIA/操作品質がAPGに届かない | 3, 4 | システムスペックのゲート。不足時はコントローラで補完（方針 #5の範囲内） | [05](../reference/stimulus-hotwire.md) |
| Tailwindビルド検証で未対応ユーティリティ発覚 | 1以降 | `tailwind-build` ジョブでの検知。upstream要件をREADME明記 | [06](../reference/theming-tailwind.md) §6 |
| chart/data-tableの再実装コスト超過 | 4 | 個別評価にてスコープ外も選択肢とする | 本ドキュメント §6 |
| 週次PRのレビュー滞留 | 1以降 | PRは常に1件まで。滞留はmanifestで可視 | [09](../reference/ci-drift-detection.md) §4 |
