# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 (unreleased)

Phase 0(インフラ構築 + Buttonによるパイプライン実証)。

### upstream出所

- 出所: `vendor/shadcn/manifest.json` を参照(tag / resolved_sha / fetched_at)
- 初期スナップショット: shadcn@4.19.0(2026-08-27取得、registry:ui 61アイテム + neutralテーマ)
- 注: upstreamインデックスに列挙されているが404となるアイテム(questionnaire, toast)は
  「upstream側の不整合」として警告付きスキップ

### レビュー対応(実装後)

3エージェントによるコードレビュー(Ruby実装・抽出器・テスト/JS)の指摘を
8コミットで修正。主要なもの:

- 抽出器: cn() 引数順序の保全(tailwind-merge の後勝ちを upstream と同一に)、
  enum ガード(side === "right" && ...)の露出prop化、boolean 既定値による
  偽陽性クラスの除去、依存アイテムの sha256 検証、defaults 優先順位の統一、
  ソート比較器のコードユニット順統一、check のオプション拒否など
- コンポーネント: void要素ヘルパ(void_tag)統一、利用者 data/aria/style の
  マージ規約適用漏れ一括解消、NativeSelect のフォーム属性送達、
  Pagination::Link の Boolean 受け、Combobox インジケータの hidden 化など
- JS/スペック: キー操作二重発火の解消、calendar スペックの時限爆弾解消、
  非同期イベント後の再試行付き検証への統一、showAt クランプ修正、
  disconnect のリスナー除去漏れ解消
- 重複削減: メニュートリオ(dropdown/context/menubar)を継承で 476→217行に畳み込み

### 追加(Phase 4 最終 — calendar の個別評価)

- Calendar(+DayButton): react-day-picker に依存しない月テーブル(年月キャプション・
  曜行・日付ボタン・前後月への GET リンク)。完全JSレス(Graceful)
- 契約は lib/shadcn_view_components/contracts/calendar.rb に個別契約として
  手動で保守(クラス値は tools/extractor と同一の cva + tailwind-merge で事前解決。
  生成物とは異なり rake shadcn:generate の対象外)
- 整合スペック: registry と targets.json + 個別契約の三方比較に拡張
- これにより vendor 61アイテムすべてが実装(適合試験対象)

### 追加(Phase 4 wave2/3 — 重量級)

- sidebar(23エクスポート): Provider の data-state による開閉、Trigger/Rail、
  メニュー階層(Menu/Sub)、Skeleton合成。Turboキャッシュ復帰相当の
  再接続冪等性システムスペック付き(05 §6.2)
- attachment(9)/bubble(4)/message(6)/message-scroller(6):
  チャット・添付の静的構造。message-scroller は追従と「一番下へ」ボタン付き
- chart(4): recharts に依存しない容器・凡例・ツールチップ構造
  (描画はホストが選ぶ — 個別評価)
- sonner(Toaster): shadcn:toast CustomEvent で通知を追加するStimulus実装
- calendar は react-day-picker の実行時クラス合成のため静的抽出対象外とし、
  個別評価として pending で明示(10-roadmap Phase 4)

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
