# 05 — Stimulus + Hotwire 設計（インタラクティブコンポーネント）

- ステータス: **Current**（現行実装の保守者向け設計資料）
- 対象読者: コンポーネント実装者・コントローラ実装者
- 関連ドキュメント: [00-overview](00-overview.md) / [04-component-conventions](04-component-conventions.md) / [07-testing](07-testing.md) / [10-roadmap](10-roadmap.md)

---

## 1. 設計思想: Rails流ネイティブ最優先

upstream（Radix / Base UI）のJSは、Reactのステート管理と密結合しており、そのまま持ち込むことはできない。
本ライブラリのふるまい層は次の優先順位で設計する:

1. **ネイティブHTML要素・API**（`<dialog>`、Popover API、`<details>`、`scroll-snap` 等）で実現できるものはネイティブで
2. ネイティブで足りない部分（キーボードナビゲーション、フォーカス管理の細部）を **Stimulusコントローラで補完**
3. Hotwire（Turbo / Streams）との統合を常に考慮（§6）
4. Radixの細部（タイプ時クローズ、复杂なフォーカストラップ等）の**忠実な再現は二次的**。
   ただし WAI-ARIA Authoring Practices Guide (APG) が定めるキーボード操作・ARIAパターンは**必須要件**とする

**「構造の契約」（`data-slot`・クラス・静的ARIA属性）は守り、「ふるまい」はRails流に作る**。
この分離により、upstreamの見た目変更は自動追従しつつ、ふるまいはHotwireエコシステムに自然に馴染む。

## 2. コントローラ規約

### 2.1 命名と配置

| 項目 | 規約 | 例 |
|---|---|---|
| ファイル | `app/assets/javascripts/shadcn/controllers/<component>_controller.js` | `dialog_controller.js` |
| Stimulus識別子 | `shadcn--<component>`（ハイフン2つでgem名を表現） | `data-controller="shadcn--dialog"` |
| ターゲット | `data-shadcn--<component>-target="<name>"`。**名前は `data-slot` と同一にする** | `data-shadcn--tabs-target="trigger"` |
| 値 | `data-shadcn--<component>-<name>-value` | `data-shadcn--carousel-value="..."` |
| クラス | `data-shadcn--<component>-<state>-class`（状態クラスの適用に使う） | — |

- ターゲット名と `data-slot` の一致は強い規約。**JSは `data-slot` にも依存してよい**
  （契約由来で消えないことが適合試験で担保されているため）
- コントローラは **ビルドレスの素のESM** とする。トランスパイル・バンドル・外部依存（jQuery等）なし。
  Stimulus本体はホストのものを利用（`@hotwired/stimulus` をimportせず、`Application` 登録時に受け取る）

### 2.2 登録インターフェース

```js
// app/assets/javascripts/shadcn/index.js
import DialogController from "./controllers/dialog_controller"
import TabsController from "./controllers/tabs_controller"
// ...

export function register(application) {
  application.register("shadcn--dialog", DialogController)
  application.register("shadcn--tabs", TabsController)
  // ...
}
```

ホスト側（importmap-rails利用時。エンジンが自動pin）:

```js
// app/javascript/application.js
import { register } from "@supermomonga/shadcn-view-components"
register(application)
```

importmap非利用のホストは、インストーラがrepository内へ同期するESM packageをlocal dependencyとして追加し、同じpackage名からimportする（[01](01-architecture.md) §3.3）。

### 2.3 コントローラ実装規約

- 1コンポーネント = 1コントローラ原則。ただし同一部品の再利用（dropdown-menu と context-menu 等）は
  **継承ではなくコンポジション**で共有ヘルパ（`controllers/lib/*.js`）を切り出す
- コントローラは **HTML構造を再構築しない**。SSRされたDOMの属性・クラスを変化させるだけ
  （`hidden` トグル、`data-state` の書き換え、ARIA属性の更新等）。
  理由: (a) SSR HTMLが常に真実の源であること、(b) Turboキャッシュとの相性、(c) 適合試験がSSR HTMLを検証対象にできること
- 状態は可能な限り **DOM自身（`data-state`・`:open` 疑似クラス・`hidden`）に持たせる**。
  Stimulus valuesは初期パラメータと、DOMに置けない状態のみに使う
- destroy時の後始末（イベントリスナ除去・`<dialog>` のclose等）を必ず実装する（Turboキャッシュ復帰対策 §6.2）

## 3. ネイティブ要素使い分け表

主要コンポーネントの現行実装方針。初期のPhase割当は履歴資料 [10-roadmap](10-roadmap.md) を参照。

| コンポーネント | 実装基盤 | Stimulusの役割 | 備考 |
|---|---|---|---|
| accordion / collapsible | `<details name="...">` | 複数openの制御・単一排他（`name`属性で排他可能）・アニメーション補助 | アニメーションは `interpolate-size` / JS。JS無効でも動作 |
| tabs | ARIA tabsパターン | roving tabindex・矢印キー・`data-state` 書き換え | `role=tablist/tab/tabpanel` は契約由来。JS無効時は全パネル表示で読める |
| dialog / alert-dialog / sheet / drawer | `<dialog>` + `showModal()` | openトリガ（`data-<controller>-target="trigger"` との紐付け）・`close` イベント処理 | ネイティブの `::backdrop`・Esc・フォーカストラップ・`inert` をそのまま利用 |
| popover | Popover API（`popover` / `popovertarget`） | 位置あわせが必要なら補助 | `popovertarget` によりJSレスで開閉可 |
| tooltip | Popover API（`popover=manual` + `showPopover`） | hover/focus のタイミング制御 | 素のtitle属性より高品質。遅延表示はコントローラで |
| hover-card | Popover API | hover intent・遅延 | 同上 |
| dropdown-menu / context-menu / menubar / navigation-menu | Popover API + ARIA menuパターン | キーボードナビゲーション・タイプ時選択・`data-state` | 共通lib（`lib/menu_navigation.js`）を合成 |
| select | ARIA combobox/listbox パターン | 開閉・キーボード・選択状態の `<input type=hidden>` 反映 | ネイティブselectは見た目制限があるためカスタム。**フォーム統合は§6.3** |
| combobox / command | 同上 + フィルタ | 入力フィルタ・ハイライト・選択・フォーム同期 | controllerとsystem specで検証 |
| checkbox / switch | `<input type=checkbox>` | native checkedを唯一の状態源として見た目用data属性を同期 | JS無効時もnative inputとCSSで操作・送信可能 |
| radio-group | `<input type=radio name=...>` | native groupのchecked状態を見た目用data属性へ同期 | 通常radioとの混在・reset・再接続を検証 |
| slider | `<input type=range>` | native値からrange/thumb装飾を同期 | pointer・keyboard・formをsystem specで検証 |
| carousel | `scroll-snap` | 前/次ボタン・インジケータ・`data-state` | |
| scroll-area | CSS（`scrollbar-width` 等のユーティリティ） | 不要 | upstreamのCSSユーティリティ契約を利用 |
| sidebar | CSS grid + `data-slot` 構造 | desktop/server-state subsetの開閉と再接続 | upstreamのmobile Sheet/cookie modelとは同一状態にせずvisual parity対象外 |
| input-otp | 1つのnative `<input>` + 表示slot | 入力・選択・composition・表示slot同期 | JS無効時も実inputを表示して送信可能 |
| resizable | flex-basis 配分 + drag | ハンドルのドラッグで前後パネルの `flex-basis` 更新 | |
| calendar | 自前実装（月グリッド） | 日付選択・月移動・keyboard navigation | 個別契約として保守 |
| form | Railsフォームとの統合層 | バリデーション状態の `aria-invalid` 付与 | §6.3 |
| chart | library非依存のcontainer/legend/tooltip/style | — | Recharts依存のグラフ本体はホスト側の責務 |

## 4. ARIA・キーボード操作チェックリスト

全インタラクティブコンポーネントのシステムスペックで検証する共通要件（[07-testing](07-testing.md) §5）:

- [ ] キーボードで到達・操作できる（Tab / Enter / Space / Esc / 矢印。APGのパターン定義に従う）
- [ ] `role` がAPG準拠（契約由来のものは改変しない）
- [ ] 状態がARIA属性に反映される（`aria-expanded`, `aria-selected`, `aria-current` 等）
- [ ] フォーカス表示が可視（upstreamの `focus-visible:ring-*` クラスに依拠）
- [ ] モーダル系: 背景 `inert`・Escで閉じる・閉じた後のフォーカス復帰（`<dialog>` がネイティブ提供）
- [ ] スクリーンリーダー向けの最小限のannounce（`aria-live` が必要な箇所の洗い出し）
- [ ] JS無効時: コンテンツが失われない（§5 のフォールバック方針を満たす）

## 5. JS無効時フォールバック方針

コンポーネント毎に次のいずれかを分類し、`data-slot` 構造と合わせて契約コメントとして残す:

| 分類 | 方針 | 例 |
|---|---|---|
| **Graceful**（JS無しで完全動作） | ネイティブ要素のみで成立 | accordion, collapsible, popover(基本), checkbox, switch, radio-group |
| **Readable**（JS無しで内容は読める・操作は不可） | SSRされた全コンテンツが表示/読み込み可能な状態で出力 | tabs（全パネル展開）, dialog（`<dialog open>` を初期HTMLに含めない設計は避ける: リンク到達で代替） |
| **JS必須** | JS無しでは初期表示のみ。`<noscript>` での案内や、サーバー側代替の提供をドキュメントに明記 | combobox, command, carousel, input-otp |

設計上、**JS必須コンポーネントでも情報がJSでしか構築されない形は避ける**（SSR済みリストをフィルタする形にする等）。

## 6. Hotwire（Turbo）統合

### 6.1 原則

- コントローラは **Turboを知らなくてよい**。ただしTurbo環境下での動作はシステムスペックで検証する
- リンク/フォームを含むコンポーネント（dialog内のフォーム等）はTurboのドライブが効くことを前提に設計

### 6.2 Turboキャッシュ（`turbo-cache-control` との付き合い）

- 開閉状態を持つコンポーネントはキャッシュ復帰で壊れないこと:
  `<dialog>` は `close` されてから復帰する、`data-state` は `disconnect()` でリセット、等を `disconnect` フックで保証
- 復帰後の再初期化は `connect()` の設計で冪等にする（二重登録防止等）

### 6.3 フォーム・サーバー状態との統合パターン

```erb
<%# dialog + turbo_frame: モーダル内フォームの定番形 %>
<%= render Shadcn::Dialog.new(id: "post-form") do |d| %>
  <%= render Shadcn::Dialog::Content.new do %>
    <%= turbo_frame_tag "post_form" do %>
      <%= form_with model: post do |f| %>
        ...
        <%= render Shadcn::Button.new(type: :submit) { "保存" } %>
      <% end %>
    <% end %>
  <% end %>
<% end %>
```

- フォーム系（select, combobox, checkbox等）は **`name` を持つ素のinputとして値を送出** する。
  カスタムselectは `<input type=hidden>` + 表示用ボタンの構成
- 成功時のモーダルクローズは `turbo:submit-end` をdialogコントローラが監視する**標準フック**（`data-action` で利用可能に）を提供:
  `data-action="turbo:submit-end@document->shadcn--dialog#closeOnSuccess"` 相当の公式スニペットをドキュメント化
- Sonner::Toasterは`shadcn:toast` CustomEventを受け、live regionへ通知を追加しduration後に削除する

### 6.4 ページ遷移を伴う操作

- ページネーションやbreadcrumbは「JSなし・リンクベース」を基本とし、コントローラを必要としない
- クライアント側で完結する操作（タブ切替等）はTurboと無関係に動く

## 7. ドキュメントとスニペットの整備

- 各インタラクティブコンポーネントについて、**upstreamのドキュメントに対応する利用例**を
  Lookbookプレビューとして用意する（[07-testing](07-testing.md) §7）。プレビューはそのまま
  「Rails流の書き方リファレンス」として機能する
- Turbo統合パターン（§6.3）はプレビューにもシステムスペックにも含め、
  「本ライブラリの推奨パターンが実測されている」状態を保つ
