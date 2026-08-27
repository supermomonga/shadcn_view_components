# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 (unreleased)

Phase 0(インフラ構築 + Buttonによるパイプライン実証)。

### upstream出所

- 出所: `vendor/shadcn/manifest.json` を参照(tag / resolved_sha / fetched_at)
- 初期スナップショット: shadcn@4.19.0(2026-08-27取得、registry:ui 61アイテム + neutralテーマ)
- 注: upstreamインデックスに列挙されているが404となるアイテム(questionnaire, toast)は
  「upstream側の不整合」として警告付きスキップ

### 追加(Phase 2 wave2 — tabs/carousel/pagination/form)

- 4アイテム / 22エクスポート: Tabs(+List/Trigger/Content), Carousel(+Content/Item/Previous/Next),
  Pagination(+Content/Item/Link/Previous/Next/Ellipsis), Form(+Item/Label/Control/Description/Message)
- 抽出器の拡張(条件付きバリアントの契約化):
  - `cva({ variant: isActive ? "outline" : "ghost", size })` のような呼び出し側制約を
    条件識別子の真偽2値 × passthrough全値域の組合せとして列挙(snake_case で契約側prop化)
  - `orientation === "horizontal" ? A : B` の静的クラス分岐をファイルスコープの
    パラメータ既定値で解決(carousel)
  - 子コンポーネント経由でルートを描くエクスポート(PaginationPrevious/Next)は
    同一アイテム内の兄弟エクスポートのルートスロットを継承
  - コンポーネント参照タグへの variant/size 属性はDOM属性ではないため契約から除外
  - JSXを返さないエクスポート(useFormField等)を契約対象から除外
- Tabs: ARIA tabsパターン + roving tabindex(矢印キー移動・aria-selected・パネル hidden 切替)
- Carousel: embla を使わない生スクロールでの再実装(ナビの有効化状態管理)
- Form: Rails流の再解釈(aria-invalid/data-error 連携、Messageは本文が無ければ描かない)
- Phase 2 のDoD: form_with統合スペック(送出・バリデーションエラー表示)、
  キーボード操作スペック、JS無効時フォールバック分類の契約コメント化
- Lookbookプレビュー4種追加(計30種)

### 追加(Phase 2 wave1 — フォーム部品・軽インタラクティブ)

- 8アイテム / 17エクスポート: Accordion(+Item/Trigger/Content), Checkbox, Collapsible(+Trigger/Content),
  RadioGroup(+Item), ScrollArea(+Scrollbar), Switch, Toggle, ToggleGroup(+Item)
- ネイティブ最優先設計(05 §3): checkbox/switch/radio は素のinput、accordion/collapsible は
  `<details>`/`<summary>` でJS無し開閉(summaryはdetailsの直接子である必要がある)、
  toggle/toggle-group は button + data-state + Stimulusコントローラ
- Stimulusコントローラ(toggle / toggle-group)と `ShadcnViewComponents.register(application)`
  登録ヘルパ、importmap環境でも解決できるベア指定子import
- 抽出器の拡張: registryDependencies 経由のcva定義解決(toggle-group → toggleVariants)、
  静的クラスのみのサブ要素cn(switch thumb)の static_attributes マージ
- システムスペック(層3): data-state/aria-pressed遷移、単一排他、ネイティブdetails開閉
- Lookbookプレビュー8種追加(計26種)

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
