# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 (unreleased)

Phase 0(インフラ構築 + Buttonによるパイプライン実証)。

### upstream出所

- 出所: `vendor/shadcn/manifest.json` を参照(tag / resolved_sha / fetched_at)
- 初期スナップショット: shadcn@4.19.0(2026-08-27取得、registry:ui 61アイテム + neutralテーマ)
- 注: upstreamインデックスに列挙されているが404となるアイテム(questionnaire, toast)は
  「upstream側の不整合」として警告付きスキップ

### 追加(Phase 4 wave1 — 残存フォーム部品・コンテナ)

- 9アイテム / 47エクスポート: Progress, Slider, NativeSelect(+OptGroup/Option),
  InputOTP(+Group/Slot/Separator), Select(+Trigger/Value/Content/Group/Item/Label/
  Separator/ScrollUp/ScrollDownButton), Field(+Content/Description/Error/Group/
  Label/Legend/Separator/Set/Title), InputGroup(+Addon/Button/Input/Textarea/Text),
  ButtonGroup(+Separator/Text), DirectionProvider
- ネイティブ最優先の継続: slider は input[type=range]、native-select は素の
  select/optgroup/option、select は Popover API listbox、input-otp は
  autocomplete=one-time-code の素のinput
- 抽出器: cva のバリアント値・compound における文字列配列の連結対応(field)
- InputOTP 等、頭字語を含む定数名の autoload 用インフレクション(OTP)を
  require 時に登録
- 残る未実装は重量級8アイテム(sidebar/calendar/chart/sonner/attachment/bubble/
  message/message-scroller)— registry.yml の pending で負債を可視化

### 追加(Phase 3 — オーバーレイ・メニュー系)

- 14アイテム / 100以上のエクスポート:
  Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Tooltip,
  DropdownMenu, ContextMenu, Menubar, NavigationMenu, Command, Combobox, Resizable
- ネイティブ最優先の本番(05 §3 / 10-roadmap Phase 3):
  - dialog系は `<dialog>` + showModal(フォーカストラップ・背景inert・EscClose・
    フォーカス復帰はネイティブ提供。alertdialog は cancel抑止)
  - popover/tooltip/menu は Popover API(light dismiss)。context-menu は
    右クリック位置に popover=manual で開く(イベント列の競合回避)
  - resizable はドラッグ + 矢印キーによるパネル配分
  - command/combobox は SSR済みリストのフィルタ(value+本文照合、
    矢印/Home/End/Enter、空グループ畳み込み、empty表示)
- Stimulusコントローラ: dialog / popover / hover-card / tooltip / menu /
  resizable / command(計8個、register()で一括登録)
- 抽出器の拡張: 引数なしcva呼び出し、`side === "right" && "クラス"` 形式の
  条件付き静的クラス解決、兄弟エクスポートのルート継承条件の厳密化、
  asChild のDOM属性除外、JSXを返さないエクスポート除外、名前無しラッパーの
  スロット記録
- 適合試験: 合成コンポーネント向け slots_mode: superset、
  静的クラスのみの契約向けフォールバック検証
- turbo:submit-end 標準フック(dialog内フォーム送信で閉じる)
- システムスペック: 開閉/Esc/inert(Tabトラップ)/フォーカス復帰/
  light dismiss/hover intent/矢印キー/右クリック/ドラッグ・ナッジ/フィルタ

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
