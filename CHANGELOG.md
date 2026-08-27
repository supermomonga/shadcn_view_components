# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 (unreleased)

Phase 0(インフラ構築 + Buttonによるパイプライン実証)。

### upstream出所

- 出所: `vendor/shadcn/manifest.json` を参照(tag / resolved_sha / fetched_at)
- 初期スナップショット: shadcn@4.19.0(2026-08-27取得、registry:ui 61アイテム + neutralテーマ)
- 注: upstreamインデックスに列挙されているが404となるアイテム(questionnaire, toast)は
  「upstream側の不整合」として警告付きスキップ

### 追加

- 生成パイプライン: `rake shadcn:sync` / `extract` / `generate` / `update` / `check`
  (tools/extractor: Node + TypeScript + Babel AST + cva/tailwind-merge事前解決)
- `Shadcn::Button`(全バリアント×サイズ組み合わせの適合試験つき)
- `ShadcnViewComponents::Classes` ランタイムクラス解決ヘルパ
- エンジン(Sprockets/Propshaft用アセットパス + importmap-rails自動pin)
- インストーラ `bin/rails g shadcn_view_components:install`(冪等)
- テーマCSS生成(oklch変数 / `@theme inline` / `.dark`)
- Sorbet `typed: strict` 全面 + tapioca RBI コミット
- CI(ci.yml: lint / sorbet / rspec / system / determinism / tailwind-build)
- 週次ドリフト検知 + 自動PR(upstream-drift.yml)
- Lookbookプレビュー(spec/dummy)とCupriteシステムスペック
