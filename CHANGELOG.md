# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 (unreleased)

Phase 0(インフラ構築 + Buttonによるパイプライン実証)。

### Checkbox・RadioGroup・Switchの状態同期

- ネイティブinputの`checked`を唯一の状態源とし、初期描画、利用者操作、フォームreset、Turbo再接続で
  `data-checked` / `data-unchecked`を同期する共通controller契約を追加した
- 同名かつ同じフォームに属するRadioを一括同期し、利用者のStimulus controller / actionと内部処理を
  重複なく合成する。任意dataとARIAは保持し、状態dataはネイティブ値を常に優先する
- `:checked`と`peer-checked`による装飾を追加し、JavaScriptが無効でも選択色、indicator、Switch thumbを
  ネイティブ操作へ追従させた。装飾要素はアクセシビリティツリーから除外した
- checked / uncheckedのLookbook previewとupstream visual parity、フォームAPIと初期状態のcomponent
  spec、代表プレビューのアクセシビリティ検査を追加した

### Carouselの縦方向・RTL・リサイズ時の状態を同期

- Rootの`orientation:`と`direction:`を公開プロパティ契約へ追加し、正規化した値を
  `data-orientation`、`data-direction`、`dir`へ出してレイアウトとcontrollerの唯一の状態源にした
- named group variantでContent、Item、Previous / Nextへ向きを伝播し、upstreamのhorizontal classを
  保ったままvertical配置とhorizontal RTLのChevron反転を追加した
- viewportやItemの実寸法に基づく前後移動、RTLのスクロール座標正規化、scroll / ResizeObserverによる
  ボタン状態の再計算、向きに応じた矢印キー操作を追加した
- Root / ItemのARIA構造と利用者指定のaccessible nameを保ち、複数Item表示で曖昧になる
  `aria-current`は追加せず、フォーカス可能なRootの矢印キー操作と現在位置をネイティブPrevious /
  Nextの`disabled`へ同期した

### InputOTPの実入力とSlot表示を同期

- 実際の`input[type="text"]`を値と選択範囲の唯一の情報源にし、初期値、入力、削除、貼り付け、
  IME、one-time-code自動入力、caretを各Slotへ同期する`shadcn--input-otp` controllerを追加した
- ブロック省略時に`length`個のSlotを1つのGroupへ描画する標準構成を追加し、明示構成では
  `Slot(index:)`と`Separator`を使えるようにした。実inputと表示コンテナの属性・クラスも分離した
- `inputmode`はキーボードのヒントで文字制限ではないことを明記し、`pattern`不一致の入力・貼り付けは
  一部の文字を除去せず変更全体を拒否するupstream互換の規則へ統一した
- JavaScript無効時に実inputを通常の入力欄へ戻す`noscript`スタイルと、フォーム・ラベル・エラー、
  caret・選択範囲、disabledを検証するsystem spec、Lookbook preview、light / dark visual parityを追加した

### Sliderをネイティブrange inputへ接続

- `id`、`name`、`form`、`disabled`、`required`、ARIA、data、イベント属性を外側の装飾ではなく
  実際の`input[type="range"]`へ渡し、ラベル連携とフォーム送信を成立させた
- inputを値の唯一の情報源とする`shadcn--slider` controllerを追加し、初期値とネイティブの
  input / changeイベントから水平・垂直のrangeとthumb位置を同期する
- `step`と`orientation`を公開プロパティ契約へ追加し、有限数、`max > min`、正のstep、値域、
  stepとの一致を描画前に検証する。値未指定時はブラウザ標準と同じstep調整済み中間値を使う
- 抽出器がinline collection callback内の`slider-thumb`とdata-slot無しのControlを取りこぼす原因を修正し、
  Track / Range / Thumb / Controlのclassをすべてupstream生成契約から取得するようにした
- 水平・垂直のLookbook preview、light / dark visual parity、ラベル・キーボード・フォーム送信の
  実ブラウザsystem specを追加した

### 複合コンポーネントのARIA参照とキーボード操作を整備

- Dialog系、Tabs、Combobox、Select、Accordion、Resizable、Calendarについて、Trigger、
  Content、Label、選択項目を一意なIDとARIA参照で結び、開閉・選択・現在値を同期した
- 利用者指定のIDとARIA属性を保持しつつ未指定値だけを補完し、fragment cacheで自動生成IDが
  重複した場合は同じルート内の自動生成参照だけを再採番する共通処理を追加した
- 同種コンポーネントの入れ子を親controllerの探索対象から除外し、TabsのHome / End、
  Resizableの矢印・Home / End、Calendarの表示月内グリッド移動を追加した
- Tabsの向きはRootの`orientation:`を唯一の指定箇所とし、Listの`orientation:`は削除した。
  Listの`aria-orientation`とキーボード操作はRootの値から補完する
- `axe-core`をCupriteへ直接読み込み、代表LookbookプレビューをWCAG 2.0〜2.2 A/AAの
  対象ルールで検査するsystem specをCIへ追加した

### ComboboxとchipsをRailsフォームへ接続

- 検索文字列、候補のハイライト、確定した送信値を分離し、確定値だけをルート直下の
  ネイティブ`select`で管理する専用`shadcn--combobox` controllerを追加した
- ルートに`name:`、`default_value:`、`multiple:`、`disabled:`、`required:`、`form:`を追加し、
  単一選択はラベルと値を分け、chipsは追加・削除・自由入力をRailsの配列パラメータへ反映する
- 空値と重複を除外し、動的chipもRubyと同じ完全なSSR templateから生成する。Turbo再接続では
  確定値から表示を復元し、初期化イベントや一時的な検索文字列を残さない
- 確定値が変わったときだけ、canonical selectからbubblingする`input`、`change`を順に発火する
- disabled / requiredのネイティブ動作と可視入力のARIAを同期し、実Rails controllerへの送信、
  422再描画、連続chip削除をcomponent / JavaScript / system specで検証した
- 空の単一値と全削除したchipsもフォーム上で明示し、chipsの空文字markerは受信側で空配列へ正規化する。
  候補はmanual popoverとしてroot外pointer・focus・Escapeで閉じ、検索inputの操作では開いた状態を保つ

### Menubar・NavigationMenuの状態管理を分離

- 単一の`shadcn--menu`が先頭のpopoverだけを操作していた構造を廃止し、Menubarと
  NavigationMenuへ各ARIAパターン専用のStimulus controllerを追加した
- Menubarの各Menu、NavigationMenuの各Item、サブメニューのTriggerとContentを
  DOM上の親要素から一対一に対応付け、IDと`aria-controls`、ARIA menuの`aria-labelledby`を同期する
- ContextMenu以外は`popover=auto`のネイティブなlight dismissを維持し、開いているTriggerへの
  pointer操作を記録して、ブラウザの自動解散後にclickで再び開く競合を解消した。非同期の`toggle`通知より
  利用者の開閉要求を優先し、開いている親popover内の子だけを残す共有調停で別rootも同時に開かないようにした
- Menubarの左右移動、NavigationMenuのネイティブリンク操作、段階的なEscape、外側クリック、
  フォーカス復帰、ARIA menuitemのEnter / Space活性化を実装し、入れ子の別controllerを
  項目探索や閉じる対象から除外した
- ContextMenu Triggerをフォーカス可能な右クリック領域へ戻し、左クリックactionが残る継承不具合を解消した。
  manualのContextMenuを開く際は既存のauto popoverを閉じ、ARIA menuはTab / Shift+Tabで全階層を閉じる。
  NavigationMenuは`nav`と通常リンクの構造へ戻し、開いたContent内のTab巡回を維持したまま
  Content外へのfocus移動で閉じる
- 複数Menu / Item、サブメニュー、入れ子の制御範囲をJavaScript単体テストと実ブラウザテストで検証した

### 公開コンポーネントと名前空間の境界を明確化

- `Chart`、`Form`、`Resizable`、`Sonner`を描画クラスではなく名前空間として定義し、
  実際に描画できる配下クラスだけを公開コンポーネントとした
- upstreamの非JSX exportを誤ってクラス化していた`Chart::Tooltip`と`Chart::Legend`を削除し、
  基底クラスと内部ナビゲーション用クラスを非公開にした
- 公開コンポーネント一覧と適合試験レジストリの一致、ルートスロット契約、全クラスの
  最小構成での描画を一括検証し、公開したクラスだけが描画時に失敗する状態を検出可能にした

### Selectをフォーム送信可能なlistboxとして完成

- primitive Rootの別名exportも抽出契約へ残し、Selectルートだけ契約面が欠けて描画時に例外となる
  原因を生成パイプラインから解消した
- `shadcn--menu`への誤った依存を廃止し、hidden inputを確定値の唯一の情報源とする専用
  `shadcn--select` controllerでクリック、全キーボード操作、disabled option、再接続を扱う
- Trigger・listbox・optionをIDとARIAで関連付け、表示値・選択状態・フォーム値を同じ値から同期する
- Selectのcomponent / DOM / system / visual parity検証とLookbook previewを追加した
- JS不要・native validation向けの`NativeSelect`との責務を明記し、装飾用sizeがHTMLの行数属性へ
  誤って流れないよう`data-size`へ分離した

### 公開プロパティの値域検証を統一

- CVAバリアントとは別に、Rails側でdata属性・ARIA・CSS値へ変換する列挙値と数値の
  `PropertyContracts` を追加し、許容値・既定値・`nil`の可否を一箇所で宣言した
- Sheet side、orientation、Toggle / Toggle Group状態、direction、状態・サイズ系propを
  String / Symbolから正規化し、未知値・`nil`・異種型を描画前の`ArgumentError`に統一した
- Progressは0〜100を検証し、不定状態の`nil`では`aria-valuenow`を省略する。Sliderは有限数、
  `min < max`、valueの包含範囲を検証し、InputOTP length・AspectRatio ratio・Toggle Group spacingも
  各境界を初期化時に検証する
- contract由来variantも型外入力を`ArgumentError`に統一し、Buttonを合成するAPIでは描画時ではなく
  初期化時にvariant / sizeを検証する

### 浮動要素の位置決めを共通化

- Popover、Tooltip、Hover Card、Dropdown / Context / Menubar / Navigation Menuと
  Submenuの座標計算を一つの位置決めmoduleへ集約し、controllerは開閉・ARIA・anchor選択だけを担う
- `side`、`align`、`side_offset`、`align_offset`、`collision_padding`をContentの共通optionとして公開し、
  upstream既定値をSSRの`data-position-*`へ出力する。実配置の`data-side` / `data-align`とは分離する
- 四辺のviewport衝突でside / alignを反転・調整し、RTLのstart/endとinline-start/inline-end、
  `--anchor-*` / `--available-*` / `--transform-origin` CSS変数を共通処理する
- overflow ancestorのscroll、window / visual viewportのresize、anchor / contentのsize変更、
  anchorのlayout移動を監視し、close・light dismiss・Stimulus切断時に全購読と予約済み更新を解除する

### 配布Stimulus controllersの検証を必須化

- gemから配布するJavaScript全体をESLintとTypeScript `checkJs`の対象にし、構文だけでなく
  DOM型、event型、未使用変数もrelease前に検出する
- 実Stimulusとjsdomを使い、全controllerの主要状態遷移、複数instance、再接続、
  listener・timerの後始末を高速なDOM単体テストで保証する
- controller一覧とtest一覧の一致を検査し、新規controllerだけが未検証で追加されることを防ぐ
- 実配布packageへの相対linkをconsumer fixtureで使い、同期直後のsourceをlint・型検査・
  DOM test・esbuild bundleのすべてで検証する

### 非Importmap向けJavaScript entry pointを実行可能にする

- gem内の `app/assets/javascripts/shadcn` を固有名のlocal ESM packageとして定義し、内部importを
  Node bundlerのpackage self-referenceで解決できるようにした
- importmapとbundlerのどちらも `@supermomonga/shadcn-view-components` を正式なentry pointとした
- importmap-railsの標準構成に従い、engineのmap定義とcache監視対象をinitializerで合成する
- bundler用packageはgeneratorがhost repository内の固定相対pathへ完全同期し、machine固有の
  gem install pathをpackage.jsonやlockfileへ保存しない
- 実consumer fixtureをesbuildし、配布済みcontroller全件の登録とToggle操作をCIで検証する
- README、install generator、ESM source commentの非Importmap手順を同じlocal package方式へ統一した

### OTP inflectionのhost applicationへの副作用を解消

- require時とengine initializerで重複登録していたグローバルな `OTP` acronymを削除した
- component定数名の規則をgem内部の一箇所へ集約し、契約解決もhostのinflectionから分離した
- Rails main loaderの既定inflectorをdelegateするpath限定wrapperをengine initializer一箇所で設定し、
  gem内の `app/components/shadcn/input_otp.rb` だけを `InputOTP` へ写像する
- 別processの契約specで、require前後とRails boot後のhost inflectionが不変であること、hostの
  同名fileに写像が漏れないこと、InputOTPのeager load成功を保証した

### install generatorのTailwind directiveを独立して保証

- host CSSのshadcn importとgem component pathの `@source` を別々に検査し、
  どちらか一方だけが既にある場合も不足したdirectiveを補う
- import / sourceの有無による4状態が同じ最終条件に収束し、generatorを再実行しても
  行の重複やbyte差分を作らないことをgenerator specで保証し、このspecを
  `verify:spec` の必須対象に加えた

### 自動upstream同期PRに必須検証を固定

- 差分検出後、PR作成前に `bundle exec rake verify` の8検査を失敗伝播ありで実行し、
  失敗した同期内容を成功扱いでPRにしないようにした
- PR作成credentialを `github.token` に固定。作成後は同じhead branchへ通常CIを
  `workflow_dispatch` し、`pull_request` eventの再帰防止や外部tokenの有無に関係なく
  PRに8個のstatus checkを付ける。PRは必ずdraftで作成し、全checkの生成を実確認した
  後だけreview readyに変更する
- PR本文とActions summaryにupstreamの完全SHA、registry snapshot hash、取得日時、
  検証結果とrun URLを表示し、manifest fixtureを使ったworkflow契約specで保証した

### upstream同期のtimestamp差分を抑止

- upstream の内容と revision が前回から変わらない場合、manifest の `fetched_at` と
  `checked_at` を保持し、定期同期が時刻だけのcommit / Pull Requestを作らないようにした
- 同一responseの再同期ではvendorスナップショット全体がバイト単位で不変になり、内容または
  revisionが変わった時だけ対応するmetadataが更新されることを固定時刻のテストで保証する

### upstream同期を整合したsnapshot単位で確定

- release metadataとlive registry一式を同期の前後で二度取得し、index、全item、theme、
  style bootstrapの集合hashとrelease tag / SHAが安定している場合だけ更新する
- manifestをversion 2へ更新し、正規化したindex / style bootstrap本体と個別SHA、registry一式の
  content SHA、二重取得の整合条件を記録する。GitHub release SHAはregistry revisionとはみなさず、
  exact versionのTailwind CSSを特定するための参考情報として分離した
- 全成果物とlocal overrideを同一filesystem上のstaging directoryへ作成・checksum検証してから
  directory単位で置換する。overrideは保存byteそのものをhash化し、確定直前と現snapshotを
  backupへ移した直後にも変更がないことを確認する。確定失敗や中断時は以前のdirectoryを復元する
- index掲載itemの404、通信、JSON、schema、metadata不一致を別の同期エラーとして中止し、
  Tailwind CSSの旧版流用やstyle依存の空配列化を廃止。どの部分失敗でも既存snapshotを保つ

### pnpm toolchainとdependency build policyの固定

- `mise.toml` と各 `package.json` で pnpm 10.22.0 を固定し、ローカルとCIが
  実行時期に左右されず同じpackage managerを使うようにした
- Extractorでは `@parcel/watcher` / `esbuild`、Visual Parityでは `esbuild` の
  install scriptだけを明示的に許可し、未判断のdependency buildは
  `strictDepBuilds` でinstall failureとして検出する
- 各toolは従来どおり独立したlockfileを維持し、workspace化による依存解決の変更を避けた

### visual parityの検証出力とbaseline更新を分離

- 通常のvisual specは `tmp/visual-parity/run-<pid>/` へ成果物を出し、追跡中の
  `spec/visual/baselines/` を書き換えない
- `rake parity:update` だけが追跡baselineを更新する。CI失敗時のours / upstream /
  diff / reportはGitHub Actions artifactとして7日間保存する

### ローカル検証とCIのentry pointを統一

- `bin/setup` でmise toolchain、Ruby gems、root / Extractor / Visual Parityの
  JavaScript依存をまとめて導入する
- `rake verify` / `rake verify:full` がCI必須の8検査をすべて実行し、CIの各jobも
  対応する `verify:*` subtaskを呼ぶようにした
- 通常RSpec jobから漏れていたrequest specと、従来のローカルverifyから漏れていた
  TypeScript、Vitest、Tailwind、RBI freshnessを共通経路へ含めた

### 残っていた parity 失敗 8件の解消(不具合修正)

参照側CSSパイプラインの独立化の時点で残っていた8件の失敗(静的5件: command / calendar
default・plain / item、アニメーション3件: dropdown-menu / combobox / hover-card)を解消。
`bundle exec rake`(shadcn:check / sorbet / rubocop / 全spec + parity)が完全に緑になった。

- アニメーション検証の整数除算バグ(combobox / hover-card): JS由来の rect 値は JSON 数値
  として整数になりうるため、`114 / 120` のような比率計算が Ruby の整数除算で 0 になり、
  アニメーション形状の比較が必ず失敗しうた。比率計算を to_f に統一(spec 側のバグ修正)
- dropdown-menu: upstream の `DropdownMenuLabel` は `Menu.GroupLabel` への写像のため、
  Group 外でメニューを開くと Base UI が文脈エラー(#31)を投げ React ツリー全体が
  アンマウントされていた(静的比較は閉じた状態のため検知できていなかった)。
  公式ドキュメント構成に従いラベルを `DropdownMenuGroup` 内へ移動(プレビュー・
  upstreamデモ両側)
- command: `Command::Input` が InputGroup 合成を持たず placeholder が消失していた
  (upstream は `<InputGroup>` + `<InputGroupAddon>` 構成)。combobox と同じ合成パターン
  で再実装し、placeholder を内側の input へ転記
- item: upstream useRender の state(`data-variant` / `data-size`)を出力していなかったため
  ItemGroup の `has-data-[size=sm]:gap-2.5` が発火せず gap が不一致。また item-separator
  が Separator 契約クラス(`shrink-0 bg-border data-horizontal:h-px`)を持たず高さ 0 だった
- calendar: セル寸法が upstream(--cell-size = 28px)より大きかった。month_grid の幅を
  7×cell に固定、DayButton 契約を `<Button variant="ghost" size="icon">` 合成に修正
  (px-2.5 がセルの最小幅を超過させていた)、ナビをキャプション行上の絶対配置に変更
  (タイトル表記も upstream に合わせ「2026年8月」)

### パリティ検証の参照側を upstream 本来のCSSパイプラインへ(検証設計修正)

visual parity の upstream 参照側は、これまで gem の `shadcn.css` を読んでいた(トークンと
フォントを両側で同一にして決定論的に比較するため)。しかし**共有したものはテスト対象から
外れる**ため、shadcn.css とその Tailwind コンパイル意味論に属する不具合 — 前項で修正した
カスタムバリアント欠落(tabs line の下線消失)もその型 — は両側で同じだけ壊れて差分が消え、
検出できなかった。

- npm shadcn パッケージ同梱の `tailwind.css`(index.json の `@import "shadcn/tailwind.css"`
  の実体)を `vendor/shadcn/style/tailwind.css` にスナップショットし、manifest の
  `source.tailwind_css` がバージョン(`upstream_release.tag` に固定)と SHA256 を記録。
  `rake shadcn:sync` がこのファイルも取得・更新する
- gem の `shadcn.css` は当該ファイルを verbatim 取り込みに変更。従来手追加していた
  `data-horizontal` / `data-vertical` の2バリアント断片を廃止し、9種のカスタムバリアント・
  accordion keyframes・`no-scrollbar`・`scroll-fade`・`shimmer` を upstream どおり提供する
- 参照側には upstream 実アプリの globals.css 相当のみを生成した
  `tools/visual-parity/src/upstream_theme.css` を与え、gem 出力から独立させた
  (`shadcn:generate` / `shadcn:check` の対象に追加)。全シナリオの描画は変化せず
  (既存の移植に CSS パイプライン起因の漏れが無いことの確認)。「accordion の開閉
  アニメーションが upstream と一致する」は keyframes 定義の供給により今回から緑化
- 新スペック `spec/conformance/custom_variant_spec.rb`: shadcn.css への verbatim取り込み
  の存在と、契約が使う bare `data-*:` バリアントが「upstream 定義済み」か「Base UI の
  bare 状態属性(presence で正しい)の許可リスト」に分類できることを機械的に検査

### 方向カスタムバリアントの欠落修正と resizable 挙動の修正(不具合修正)

契約が使う Tailwind の `data-horizontal:` / `data-vertical:` が、存在しない
`[data-horizontal]` 属性へのマッチにコンパイルされており、`data-orientation`
を出力するどのコンポーネントにも適用されていなかった。tabs では active
インジケータ(line バリアントの下線)の寸法・位置指定が死んでいて下線が描かれず、
root の `data-horizontal:flex-col` も効かないためリストとコンテンツが横並びに
なっていた。parity 検証は upstream 側も同じテーマCSS(shadcn.css)で描くため、
この欠落を検出できていなかった。

- extractor の CSS 生成に upstream npm shadcn/tailwind.css 由来の
  `@custom-variant data-horizontal / data-vertical` を追加し、shadcn.css と
  dummy の静的CSSを再生成。tabs ほか button-group / field / scroll-area /
  separator / slider / toggle-group の方向系クラスが活性化する
- resizable コントローラの修正:
  - ドラッグ軸の反転(セパレータの `aria-orientation="vertical"` を縦方向
    ドラッグと解釈しており、横並びグループで上下移動が分割を変えていた)を正す
  - 前後パネルの対を「ハンドルより手前のパネル数」から決める(子要素全体の
    index だったため、3パネル以上で2個目以降のハンドルが無反応だった)
  - ドラッグを開始時の比率 + 移動量の相対方式に変更(カーソルの絶対位置をそのまま
    比率にしていたため、掴んだ瞬間パネルがカーソル位置へ跳んでいた)
  - 縦積みグループで上下キーでもリサイズできるようにし、flex-basis は %
    表記のときだけ信頼する
- `Resizable::PanelGroup` / `Resizable::Handle` に `orientation:` を追加し、
  垂直グループ(PanelGroupの`data-orientation="vertical"`でflex-col、Handleの
  `aria-orientation="horizontal"`でrow-resize)を構成できるように
- Lookbook に `tabs/vertical` と `resizable/vertical` のシナリオを追加
  (parity の upstream デモ・シナリオも登録)

### combobox の選択確定・chips 操作の実装(不具合修正)

選択肢のクリック・chips入力欄でのEnter確定が全く機能しない不具合を修正した。
原因は選択確定の接線がJS/Ruby双方に存在しなかったことと、chipsプレビューが
コントローラ無しで描かれていたこと。

- `Combobox::Item` に `data-action="click->shadcn--command#select"` を追加し、
  クリック(およびEnter時の合成クリック)で選択確定するように。単一選択では
  チェックインジケータ(`data-indicator`)の移動・入力欄へのラベル反映・リストを
  閉じるまでを行う。キー操作は従来どおりキャプチャリスナーに一元化
  (data-action 化による二重発火は起こさない)
- chipsモード: `Combobox::ChipsInput` をコントローラが発見できるようにし、Enter で
  ハイライト項目(リスト無し時は入力テキスト)を新規chipとして確定。
  `Combobox::Chip` の削除ボタンにも `removeChip` アクションを接線
  (動的追加chipにも効く。新規chipは接続時に確保した既存chipの複製で、
  クラスと削除ボタンを引き継ぐ。全chip削除後の追加でも契約どおりのマークアップになる)
- chipsプレビュー(`combobox/chips`)を `Shadcn::Combobox.new` でラップし
  コントローラを接線
- 選択確定時に入力欄の `aria-expanded` を開閉に同期
- 適合試験: allowances の `ComboboxItem` に `data-action` を許可に追加

### form の Field ベース再設計(破壊的変更)

base-nova には form アイテムが存在せず、公式 docs/forms ガイドは Field プリミティブ +
`data-invalid` / `aria-invalid` の手動ワイヤリングへ移行した(Issue #3)。旧new-york-v4
定義の local-override 維持を撤退し、同ガイドに沿った独自契約として再設計した。

- 新API(2 exports):
  - `Shadcn::Form::Item` — Field と同じ DOM 構造(`data-slot="field"`)を描く。
    `invalid:` キーワードで `data-invalid="true|false"` を出力。`orientation:` も
    Field と同様に受け付ける
  - `Shadcn::Form::Error` — upstream `FieldError` セマンティクスの Rails 向け版。
    `message:`(文字列)/`errors:`(文字列配列、重複除去)を受け、1件は平文・
    複数は ul リスト・無ければ非描画。`model.errors.full_messages_for(:attr)` を
    そのまま渡せる
- 廃止: `Form::Label` / `Form::Control` / `Form::Description` / `Form::Message`。
  ラベルと説明は `Shadcn::Field::Label` / `Shadcn::Field::Description` を直接使う
- 属性変更: ラベルの `data-error` → Field 構造の `data-invalid`(破壊的変更)。
  `aria-invalid` / `aria-describedby` / `for`-`id` の紐付けは従来どおり呼び出し側責務
- 契約: `vendor/shadcn/overrides/items/form.json` を「旧スタイルの逐語コピー」から
  独自契約(オリジナルソース)へ書き換え。`registryDependencies` は `field` のみ
  (react-hook-form / zod 等のnpm依存は解消)。FormField の孤児契約も消滅
- 関連更新: `Field::Error` も upstream 準拠で「本文無ければ非描画」に。
  `Shadcn::Field` が upstream と同様に `data-orientation` を出力するように。
  `Field::Label` は upstream と同じく `<Label>` の契約クラスを実行時合成する
  (適合試験は allowances の `class_mode: contains` で緩和)。
  field プレビュー(`field/default` / `field/horizontal`)と visual parity
  シナリオを追加し、form の parity デモを react-hook-form 非依存に書き換え。
  parity参照サーバのビルド入力が変わっても再ビルドされない
  `parity_server.rb` の `stale?` 判定(比較演算の向き)を修正
- direction(Issue #3): base-nova は re-export のみで抽出可能な契約面が無いため
  **現行維持**(手書き `DirectionProvider` + local-override)。決定は
  docs.local/00-overview §5 決定ログに記録

### スタイル移行: new-york-v4 → base-nova(破壊的変更)

公式ドキュメントのデフォルトがbase系プリセットへ移行した(docsの`/docs/components/*`は
baseページへ307リダイレクト、CLI `init -d`は`--preset=base-nova`、`new-york-v4`はCLIの
`FALLBACK_STYLE`=レガシー配信)ことに追従し、vendoring対象スタイルを`base-nova`へ移行した。

- 契約: 全60コンポーネントのクラス文字列がbase-novaに更新(Badge destructive は
  `bg-destructive/10 text-destructive` の淡い表現へ。公式docs表示と一致)
- 属性契約: `data-state=open/closed` → `data-open` / `data-closed`(Base UI規約)。
  accordion / dialog / sheet / drawer / popover / hover_card / tabs / toggle 系の
  コントローラ・コンポーネントを更新
- 廃止対応: base-novaに存在しない `Popover::Anchor` / `Select` ルート契約 /
  `NavigationMenu::Viewport` を非対応化(または削除)。`form` / `direction` は
  upstreamから提供が無い(または re-export のみ)ため
  `vendor/shadcn/overrides/items/`(origin: local-override)として現行維持
- 抽出器: Base UI `useRender` パターンをJSX形状へ機械変換する対応を追加
  (`parse/userender.ts`)。`IconPlaceholder` / キャメルケースprops(DOM属性でない)の除去
- 新規未対応: `questionnaire` / `toast`(個別評価)
- 検証: 適合試験・コントラクト整合は全件更新。visual parity のbaselineは
  base-nova描画で再生成

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
- InputOTP の autoload mappingはengine内の対象fileだけに限定し、hostの命名規則に影響させない
- 残る未実装は重量級8アイテム(sidebar/calendar/chart/sonner/attachment/bubble/
  message/message-scroller)— registry.yml の pending で負債を可視化

### 追加(Phase 3 — オーバーレイ・メニュー系)

- 14アイテム / 100以上のエクスポート:
  Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Tooltip,
  DropdownMenu, ContextMenu, Menubar, NavigationMenu, Command, Combobox, Resizable
- ネイティブ最優先の本番(05 §3 / 10-roadmap Phase 3):
  - dialog系は `<dialog>` + showModal(フォーカストラップ・背景inert・EscClose・
    フォーカス復帰はAlertDialogを含めてネイティブ提供)
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
