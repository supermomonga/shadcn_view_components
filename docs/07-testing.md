# 07 — テスト戦略（RSpec・適合試験・システムスペック・見た目比較・Lookbook）

- ステータス: **Current**（現行実装の保守者向け設計資料）
- 対象読者: コンポーネント実装者・CI管理者
- 関連ドキュメント: [00-overview](00-overview.md) / [03-extraction-codegen](03-extraction-codegen.md) / [05-stimulus-hotwire](05-stimulus-hotwire.md) / [09-ci-drift-detection](09-ci-drift-detection.md)

---

## 1. テストの5層

| 層 | 対象 | ツール | 守るもの |
|---|---|---|---|
| (1) コンポーネントスペック | 手書きViewComponentのAPI・レンダリング | RSpec + `ViewComponent::TestHelpers` | Ruby APIの品質（[04](04-component-conventions.md)） |
| (2) **適合試験 (conformance)** | 生成契約 vs レンダリングHTML | RSpec + 契約JSON（自動パラメータ化） | **upstreamとの視覚的・構造的一致**（本ライブラリの核心） |
| (3) システムスペック | Stimulusコントローラのふるまい | RSpec + Capybara + **Cuprite**（ヘッドレスChrome, Ferrum） | ARIA・キーボード操作・Hotwire統合（[05](05-stimulus-hotwire.md) §4） |
| (4) 生成物整合スペック | 生成Ruby・CSS・manifest | RSpec + ファイル検査 | パイプラインの健全性（[03](03-extraction-codegen.md) §7） |
| (5) visual parity | upstream React/ViteとLookbook preview | RSpec + Cuprite + pixelmatch | light/darkの描画差分とアニメーション補間値 |

加えて開発補助として **Lookbook**（ViewComponentプレビュー）をspec/dummyにマウントする（§7）。

## 2. テスト環境構成

```
spec/
├── dummy/                        # マウント用ダミーRailsアプリ（Rails 8.1）
│   ├── app/components/previews/  # Lookbookプレビュー（Shadcn::*Preview）
│   ├── app/views/pages/          # システムスペック用固定ページ
│   └── config/application.rb     # gemをマウント + Cuprite登録
├── components/                   # (1)
├── conformance/                  # (2) ★契約から自動生成されるスペック群
├── system/                       # (3)
├── contracts/                    # (4)
├── visual/                       # (5) upstreamとの静的・アニメーションparity
└── support/
    ├── conformance_matcher.rb    # 「クラス列が契約に一致する」カスタムマッチャ
    └── stimulus_helpers.rb       # data-controller/target形式の組み立てヘルパ
```

- ダミーアプリは **spec/dummy に固定**（rails-plugin标准構成）。テスト実行は `appraisal` 等の
  複数バージョンmatrixなし（サポートはRuby 4.0+ / Rails 8.1+ の1本。決定 #6）
- CupriteはChrome実行ファイルを要求するため、CIでは `browser-actions/setup-chrome` 等で用意（[09](09-ci-drift-detection.md) §2）
- `spec/visual/parity_spec.rb` はlight/darkのスクリーンショットを比較し、
  `spec/visual/animation_parity_spec.rb` はアニメーションを同じ進捗へ固定して補間値を比較する。
  対象外は `spec/coverage/registry.yml` に設計差の理由とともに明示する

## 3. 適合試験（conformance）の設計 — 自動検知の中核

### 3.1 原理

```
gen/contracts/button.json の combinations
  "variant=outline&size=sm" → "inline-flex ... h-8 ..."
        │ をそのまま期待値として使う（ゴールデンは契約そのもの。二重管理しない）
        ▼
Shadcn::Button.new(variant: :outline, size: :sm).render_in(...)
  → Nokogiriで解析 → class属性・data-slot・静的属性を抽出
        ▼
一致検証（クラス列は正規化順で完全一致、属性はキー/値の一致）
```

### 3.2 スペックの自動パラメータ化

適合試験のスペックは手書きしない。**契約JSONを走査して動的にexampleを生成する**:

```ruby
# spec/conformance/conformance_spec.rb（registryを走査して動的定義）
RSpec.describe "conformance: button/Button" do
  ShadcnViewComponents::Contracts::Button::COMBINATIONS.each do |options, expected|
    it "renders classes matching upstream for #{options.inspect}" do
      render_inline(Shadcn::Button.new(**options))
      expect(rendered_root_element).to conform_with_contract(
        classes: expected,
        data_slot: ShadcnViewComponents::Contracts::Button::ROOT_SLOT,
        static_attributes: ShadcnViewComponents::Contracts::Button::SLOTS
      )
    end
  end
end
```

- 「どの契約がどのスペックに対応するか」の対応表（`spec/conformance/registry.yml`）を1つ持ち、
  **コンポーネント追加時に1行追加するだけ**で全バリアント組み合わせの適合試験が走る
- upstreamでバリアントが増える → 生成物の `COMBINATIONS` が増える → **スペックが自動的に増える**。
  新バリアントが未実装なら `render_inline` の `ArgumentError` / 要素不一致で即座に赤になる。
  これが「upstream変更の自動検知」の主要経路である

### 3.3 検証項目

| 検証 | 内容 |
|---|---|
| クラス列 | ルート要素のclassが契約の事前解決文字列と**順序含め完全一致**（正規化: 連続空白の圧縮のみ） |
| data-slot | 描画されたHTML内の `data-slot` 値集合 == 契約のスロット集合 |
| 静的属性 | 契約 `static_attributes` が出力に含まれる |
| 子クラスの適合 | 複合コンポーネント（Card等）はネストクラス毎に同検証 |
| システムスペック前提の構造 | `data-controller` / targetが規約（[05](05-stimulus-hotwire.md) §2.1）どおり出力されているか |

### 3.4 適合から意図的に外れるもの

| ケース | 扱う方法 |
|---|---|
| ネイティブ要素化に伴う属性追加（`popover`, `name` 等、本ライブラリの設計由来） | `spec/conformance/allowances.yml` に「追加を許す属性」をコンポーネント単位で明示的に列挙（ブラックリストではなくホワイトリスト。検証は「契約 ∪ 許可リスト」に一致） |
| upstreamの `dynamic_attributes`（JSで変化する属性） | 適合試験の対象外（システムスペック側で検証） |
| クラス列の不一致が**許容される**ケース | 原則なし。許容が必要だと判明した場合、その理由をallowances.ymlのコメントと本ドキュメントに残す |

## 4. コンポーネントスペック（層1）で検証するもの

適合試験と重複しない範囲:

- Ruby APIのふるまい: `tag:` 差し替え、`class:` のtailwind-merge統合（上書きが後勝ちになること）、
  無効なバリアントでの `ArgumentError`、slots/ブロックの受け入れ
- `Shadcn::<Name>.classes(...)` モジュール関数の戻り値
- ERB出力のエスケープ安全性（悪意ある属性値がエスケープされること）

## 5. システムスペック（層3）で検証するもの

[05-stimulus-hotwire](05-stimulus-hotwire.md) §4 のチェックリストをspec/dummyの固定ページ経由で検証:

- キーボード操作（Tab/Enter/Space/Esc/矢印）がAPG準拠で動作する
- ARIA状態の遷移（`aria-expanded` 等）
- `<dialog>` のネイティブ挙動（背景inert・Esc・フォーカス復帰）
- Turbo Cache 復帰後の健全性（`turbo-cache-control` 付きページを行き来した後の再初期化）
- `turbo:submit-end` フック（dialog内フォーム成功時に閉じる）
- JS無効時のフォールバック分類（[05](05-stimulus-hotwire.md) §5）が守られているか
  （Cuprite/FerrumからChromeの`Emulation.setScriptExecutionDisabled`を有効化して再訪する）

## 6. 生成物整合スペック（層4）

- `lib/shadcn_view_components/generated/` 配下の全ファイルに「AUTO-GENERATEDヘッダ」があること
- vendor manifestの63アイテムと`spec/conformance/registry.yml`を完全一致させる。現在は61アイテムを実装し、
  `questionnaire`と`toast`の2件を`pending: true`として明示している
- 実装済み61アイテムは`spec/coverage/registry.yml`と完全一致し、render smoke・preview・parity・interaction・systemの判断を必須にする
- `vendor/shadcn/manifest.json` の `items.*.sha256` が実ファイルと一致すること（手編集の検知）
- `docs/components/` のAPIリファレンスが、Ruby initializer・生成契約・coverage registry・代表preview・手書きの意味仕様と一致すること。
  `bundle exec rake docs:check` は生成漏れと古いページを検知し、代表previewの実行可否はrequest specで確認する

## 7. Lookbookプレビュー

- `lookbook` gemを開発依存に追加し、spec/dummyの**ルートパス(`/`)**にマウント
  （エンジン内にcatch-allルートがあるため、pages/* のルートより後に置く）
- 各コンポーネントに `Shadcn::ButtonPreview` 等（`ViewComponent::Preview`）を用意し、
  **全バリアント×主要な組み合わせを並べる**（upstreamのdocsページに相当）
- プレビューは手動確認にも使い、全exampleをrequest specで実際に描画する。さらにcoverage registryの代表pathを契約specで照合する:
  - Lookbookのパラメータ機能（`param`）でバリアントを切り替えられるようにし、
    レビュー時に全状態を一望できる
  - ダークモード切替用のトグルをdummyアプリ側に用意（[06](06-theming-tailwind.md) §3）
- visual parityはcoverage registryの99シナリオをlight/darkで比較する。5アイテムの対象外判断には、同一状態を比較できない設計差の理由を記録する

## 8. カバレッジとゲート

| 指標 | ゲート |
|---|---|
| 適合試験 | 実装済み61アイテムの契約組み合わせ100%。pending 2件は未実装境界として明示 |
| システムスペック | coverage registryで33アイテムを対象とし、spec metadataのbehavior集合と双方向照合 |
| 行カバレッジ | 目標値を設けない（契約駆動のための指標として意味が薄い）。`srb tc` と適合試験が主品質ゲート |

## 9. 実行コマンド

```
bundle exec rspec                         # 全部
bundle exec rspec spec/conformance        # 適合試験のみ（追従PRで最初に見る）
bundle exec rspec spec/system             # ふるまいのみ
bundle exec rspec spec/conformance/conformance_spec.rb  # registry駆動の適合試験
mise run lookbook                         # プレビュー(dummyをpumaで起動、http://localhost:9292/)
```
