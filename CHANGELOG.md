# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 (unreleased)

Phase 0(インフラ構築 + Buttonによるパイプライン実証)。

### upstream出所

- 出所: `vendor/shadcn/manifest.json` を参照(tag / resolved_sha / fetched_at)
- 初期スナップショット: shadcn@4.19.0(2026-08-27取得、registry:ui 61アイテム + neutralテーマ)
- 注: upstreamインデックスに列挙されているが404となるアイテム(questionnaire, toast)は
  「upstream側の不整合」として警告付きスキップ

### 追加(Phase 1 — 表示のみコンポーネント)

- 17アイテム / 60エクスポート: Badge, Alert, Card(+Header/Title/Description/Action/Content/Footer),
  Avatar(+Image/Fallback/Badge/Group/Group::Count), Separator, Skeleton, Table(+7部位),
  Label, Kbd(+Group), Spinner, Empty(+5部位), AspectRatio, Item(+9部位), Marker(+2部位),
  Input, Textarea, Breadcrumb(+6部位)
- 抽出器の拡張: cva defaultVariants 未指定時のパラメータ既定値、data-slot を持たない
  ルート(spinner等)、cn を経ない静的className(table-container等)、classes_slot
  (契約クラスがルート以外の要素に属する構造の検証対象特定)
- 複合エクスポート対応の適合試験(registry.yml の exports リスト)と
  class_mode: contains の allowances(upstream が実行時に別アイテムのクラスを合成する構造)
- Lookbookプレビュー18種、コンポーネントスペック、targets/registry/generated 三方整合スペック

### 追加(Phase 0)

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
