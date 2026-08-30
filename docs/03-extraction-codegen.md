# 03 — 抽出・コード生成パイプライン

- ステータス: **Current**（現行実装の保守者向け設計資料）
- 対象読者: 抽出器（`tools/extractor`）の実装者・メンテナー
- 関連ドキュメント: [00-overview](00-overview.md) / [02-upstream-sync](02-upstream-sync.md) / [04-component-conventions](04-component-conventions.md) / [07-testing](07-testing.md)

---

## 1. パイプラインの全体像

```
vendor/shadcn/registry/items/*.json         ← 唯一の入力（ネットワーク不使用）
        │
        │  (1) parse    TSXをBabel ASTで解析
        │  (2) derive   バリアント組み合わせ列挙 + cva/tailwind-merge事前解決
        │  (3) validate Zodスキーマ検証
        ▼
gen/contracts/<name>.json                   ← 契約JSON（中間表現・コミット対象）
        │
        │  (4) emit      Ruby / CSS コード生成
        ▼
lib/shadcn_view_components/generated/       ← typed: strict なRubyクラスマップ
app/assets/stylesheets/shadcn/shadcn.css    ← テーマCSS
```

各段階は純関数として実装する。**状態・乱数・時刻・環境変数・ファイルmtimeに依存しない**。
この制約により「同一スナップショット → 同一生成物」が保証され、`rake shadcn:check`（[02](02-upstream-sync.md) §5.5）
で冪等性をCI検証できる。

## 2. 実装構成

- **ランタイム**: Node.js（LTS）+ TypeScript（strictモード）。パッケージマネージャはpnpm
- **主要依存**:
  - `@babel/parser` / `@babel/traverse` — TSXのAST解析（typescript + jsx プラグイン）
  - `zod` — 契約スキーマの定義と検証
  - `class-variance-authority` / `tailwind-merge` / `clsx` — **upstreamと同一の実装**による事前解決（§5）
  - `prettier` — 生成JSON/Rubyの整形には**使わない**（外部ツール差し込みによる非決定論を排除。自前の正規化器 `normalize.ts` を使う）

```
tools/extractor/src/
├── cli.ts            # サブコマンド: fetch / extract / generate / check（rakeから呼ばれる）
├── fetch.ts          # レジストリ取得（sync専用。extract以降からはimport禁止をESLintで強制）
├── parse/
│   ├── cva.ts        # cva(...) 呼び出しの解析
│   ├── cn.ts         # cn(...) / cn(条件式, ...) の解析
│   ├── slots.ts      # JSX要素の data-slot / タグ種別 / ARIA属性の収集
│   └── context.ts    # 「どのJSX要素がどのコンポーネントエクスポートに属するか」の解決
├── derive/
│   └── combinations.ts  # バリアント組み合わせの列挙と事前解決
├── contract.ts       # 契約JSONスキーマ（Zod）
├── emit/
│   ├── json.ts       # gen/contracts/*.json
│   ├── ruby.ts       # lib/shadcn_view_components/generated/contracts/*.rb
│   └── css.ts        # shadcn.css / upstream_theme.css(visual-parity 参照側)
└── normalize.ts      # 決定論的整形規則（§7）
```

## 3. 解析対象と解析規則（parse）

upstreamのTSX（例: button.tsx）は概ね次の形をとる（2026年8月時点。`forwardRef` は削除済み、
全primitiveが `data-slot` を持つ、素のradix-ui統一パッケージ/またはBase UIを利用）:

```tsx
function Button({ className, variant = "default", size = "default", ...props }) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap ...",
  {
    variants: {
      variant: { default: "...", destructive: "...", outline: "...", ... },
      size: { default: "...", sm: "...", lg: "...", icon: "..." },
    },
    compoundVariants: [{ variant: "link", size: "icon", class: "..." }],
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

抽出器はこれを次のように読む:

| 抽出対象 | 解析方法 |
|---|---|
| `cva(base, config)` の base文字列 | `cva` 識別子のCallExpressionの第1引数。テンプレートリテラルは `${}` を展開せず**定数文字列のみ受け入れる**（式を含む場合は明示的にエラーとし、ホワイトリスト的な手対応へエスカレーション） |
| `variants` マップ | 第2引数のObjectProperty。キー=prop名、値=オブジェクト（キー=バリアント値、値=クラス文字列） |
| `compoundVariants` | 配列。`{ <prop>: <value>, ..., class: "..." }` をすべて収集 |
| `defaultVariants` | オブジェクト。そのまま既定値として記録 |
| `cn(...)` 呼び出し | `className={cn(A, B)}` をAST上で発見し、A/Bそれぞれの種別（cva参照/文字列/`props.className`）を記録。`props.className` は「利用者上書き可能」の印として契約に反映 |
| `data-slot` | JSXAttributeの文字列リテラル。要素のタグ名とセットで収集 |
| ARIA属性 | `role`, `aria-*`, `data-state` 等の静的リテラルを収集（動的値は `dynamic: true` として記録） |
| 条件レンダリング | `&&` / 三項演算子によるJSX分岐は、分岐ごとに**別スロット候補**として記録（例: avatarのfallbackとimage） |

解析の設計原則:

1. **静的に確定しないものは推測しない** — 式を含むclassName等はエラーにして早く失敗する。
   upstreamが新構文を採用した場合の第一検知点はここである（[02](02-upstream-sync.md) §8）
2. **構文解析であって意味理解ではない** — 「このコンポーネントが何を意味するか」は解釈しない。
   構造的事実（クラス列・属性・スロット）のみを抽出する。意味の解釈は手書きコンポーネント側の人間の仕事
3. **エクスポート単位で解析する** — 1アイテムが複数ファイル・複数エクスポートを持つ場合
   （card等）、エクスポートごとにスロットを束ね、依存（`registryDependencies`）で連結する

## 4. 契約JSONスキーマ（contract）

`gen/contracts/<name>.json` の構造。Zodで定義し、生成直後に自己検証する
（壊れた/悪意あるアイテムが生成物を汚染しないゲート。[01](01-architecture.md) §6.3）:

```jsonc
// gen/contracts/button.json（例・コメントは説明用。実物には含まれない）
{
  "schema_version": 1,
  "name": "button",
  "source": { "item_sha256": "5a1d..." },        // vendor側アイテムとの紐付け
  "exports": {
    "Button": {                                   // upstreamのエクスポート名
      "root_slot": "button",                      // ルート要素のdata-slot
      "component_class": "Shadcn::Button",        // 対応するRubyクラス（命名は04 §2）
      "cva": {
        "prop_names": ["variant", "size"],
        "defaults": { "variant": "default", "size": "default" },
        "compound": [
          { "when": { "variant": "link", "size": "icon" }, "class": "..." }
        ]
      },
      "combinations": {                           // ★事前解決済みの最終クラス文字列（§5）
        "variant=default&size=default": "inline-flex items-center ... bg-primary ...",
        "variant=default&size=sm": "inline-flex ... h-8 ...",
        "variant=outline&size=default": "inline-flex ... border bg-background ..."
      },
      "slots": [
        {
          "name": "button",                       // data-slot値
          "tag": "button",                        // 既定タグ
          "static_attributes": { "type": "submit" },   // TSXに静的に書かれた属性
          "dynamic_attributes": ["aria-expanded"] // 動的属性（手書き側で責務を持つ）
        }
      ],
      "passthrough_class": true                   // props.classNameを受け入れるか
    }
  },
  "css_vars": { "light": { "primary": "oklch(...)" }, "dark": { "...": "..." } },
  "css": "@keyframes accordion-down { ... }",
  "registry_dependencies": ["utils"]
}
```

規則:

- 全オブジェクトのキーは**辞書順ソート**（`combinations` のみ列挙順を昇順ソートした上で固定）
- タイムスタンプ・絶対パス・マシン依存の情報は**含めない**
- `schema_version` を持たせ、抽出器と契約の互換を管理する

## 5. 事前解決（derive）— このパイプラインの核心

### 問題

upstreamのクラス決定は `cn(cva({...}), className)`、すなわち
**cvaによるバリアント解決 → tailwind-mergeによる競合解決** の2段階で行われる。
特に `tailwind-merge` は「後勝ち」で競合ユーティリティを除去する（例: `p-4 p-2` → `p-2`）。
これをRubyで再実装すると、upstreamのtailwind-mergeの挙動更新に追従しきれず、
**見た目の静かな乖離**を生む。

### 解決

バリアントの値域は有限（enum値とブールの組み合わせ）であることに着目し、
**全組み合わせをNode上で列挙し、upstreamと同一バージョンの `cva` + `tailwind-merge` を
実行して最終クラス文字列を求めてしまう**。Rubyランタイムは辞書引きするだけになる:

```
combinations[["variant", "outline"], ["size", "sm"]]
  → "inline-flex items-center justify-center gap-2 ... h-8 rounded-md ..."
```

- 組み合わせ数は各コンポーネント高々数百程度であり、生成物サイズは実用範囲
- upstreamの `tailwind-merge` がアップデートされて挙動が変わっても、
  extractor側の依存を更新して再生成すればよい（= 挙動変更も「再生成」に吸収される）
- Ruby側の実行時マージは、**利用者が明示的に渡した追加クラスとの統合**（`tailwind_merge` gem）に限定される
  （[04-component-conventions](04-component-conventions.md) §6）

### Rubyランタイムに残す役割

組み合わせテーブルの辞書引き + 追加クラスの統合のみ。これにより:

- クラス解決ロジックのupstream追従コスト = ゼロ（テーブルが変わるだけ）
- `srb tc` の型検査対象も単純なテーブル参照に限定される（[08-sorbet](08-sorbet.md)）

## 6. コード生成（emit）

### 6.1 Ruby（`lib/shadcn_view_components/generated/contracts/<name>.rb`）

```ruby
# typed: strict
# frozen_string_literal: true

# !! AUTO-GENERATED by tools/extractor — DO NOT EDIT !!
# Source: shadcn/ui base-nova "button" (item sha256: 5a1d...)
# Regenerate with: rake shadcn:generate

module ShadcnViewComponents
  module Contracts
    module Button
      ROOT_SLOT = T.let("button", String)

      DEFAULTS = T.let({ variant: :default, size: :default }.freeze, T::Hash[Symbol, Symbol])

      # キーはソート済みpropペア。値は事前解決済みの最終クラス文字列
      COMBINATIONS = T.let({
        { size: :default, variant: :default } => "inline-flex items-center ...",
        { size: :sm, variant: :default } => "inline-flex ... h-8 ...",
        # ...
      }.freeze, T::Hash[T::Hash[Symbol, Symbol], String])

      SLOTS = T.let([
        { name: "button", tag: "button", static_attributes: { type: "submit" } }.freeze
      ].freeze, T::Array[T::Hash[Symbol, T.untyped]])

      module_function def combination(options)
        COMBINATIONS.fetch(options)
      end

      module_function def variants
        COMBINATIONS.keys.each_with_object(Set.new) { |k, s| k.each { |p, v| s << [p, v] } }
      end
    end
  end
end
```

生成規則:

- ヘッダに「生成物であること・出所・再生成コマンド」を必ず記す
- **`rubocop -a` 相当の整形を自前のemitterで保証**（外部ツール呼び出しは非決定論源）
- クラス文字列は折叠せずそのまま（upstreamとのdiff対応を容易にするため）
- `combination(options)` はキーが存在しない場合 `KeyError` を発生（fail-fast。[01](01-architecture.md) §6.1）

### 6.2 CSS（`app/assets/stylesheets/shadcn/shadcn.css`）

全アイテムの `cssVars`（light/dark/theme）と `css` ルールをマージして単一ファイルにする:

```css
/* !! AUTO-GENERATED by tools/extractor — DO NOT EDIT !! */
@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... 全semantic token（cssVars.theme / light の統合） */
}
.dark {
  --background: oklch(0.145 0 0);
  /* ... */
}
@theme inline {
  --color-background: var(--background);
  /* ... */
}
@keyframes accordion-down { /* ... upstream cssフィールド由来 */ }
/* ... */
```

重複するkeyframes等はアイテム名順に並べ、重複排除は**完全一致のみ**（意味的重複は判定しない）。
構造の詳細は [06-theming-tailwind](06-theming-tailwind.md)。

加えて、upstream 実アプリの globals.css 相当を `tools/visual-parity/src/upstream_theme.css`
としても生成する(§6.2のトークン + @theme + npm `shadcn/tailwind.css` verbatim + base layer。
gem 固有の実行時規則は含まない)。visual-parity の upstream 参照側はこのファイルで描画し、
gem の `shadcn.css` から独立させる。参照側を gem 出力と共有すると、移植漏れが両側で
同じだけ壊れて差分が消える(=パリティ検証の盲点になる)。

## 7. 決定論性規則（normalize）

生成物が冪等であるためのルール。すべて `normalize.ts` に集約し、各emitterは必ず通す:

1. **禁止事項**: タイムスタンプ・乱数・`process.cwd()`・環境変数・ファイルmtime の出力への反映
   （※§6.1ヘッダの `item sha256` は入力由来なので可）
2. JSON: `JSON.stringify(value, replacer, 2)` + LF + 末尾改行。キーは再帰的にソート
   （`combinations` はソート済みタプルの辞書順）
3. Ruby: 2スペースインデント・LF・末尾改行。文字列は必要に応じてダブルクォートに統一
4. CSS: セレクタ/宣言順を「入力順 + 辞書順」の固定規則で並べる。ベンダープレフィックスの自動付与はしない
5. ファイル一覧はアイテム名の辞書順に並べる。**存在しなくなった契約に対応する生成ファイルは削除する**
   （upstream廃止を生成物に反映する）
6. 出力は**アトミックに**書き込む（一時ファイル→rename）。中断時に中途半端な生成物が残らないようにする

## 8. 失敗モードとエスカレーション

| 状態 | 挙動 | 扱う人 |
|---|---|---|
| TSXに動的クラス式があり静的解決不能 | `extract` が非ゼイexit。アイテム名・ノード位置を報告 | 抽出器メンテナーが `parse/cva.ts` に新しいパターンを追加 |
| 契約スキーマ違反（未知フィールド等） | `validate` が非ゼイexit | 同上。upstreamのスキーマ変更対応 |
| 組み合わせ爆発（バリアント値域が異常に大きい） | 閾値（例: 1024組み合わせ）を超えたら警告 + 打ち切り | 当該コンポーネントを `tools/extractor/config/overrides.json` で個別対応（手書きテーブル注入） |

`overrides.json` による手動注入は**最後の手段**とし、使用時はその理由をファイル内コメントに残す。
使用状況は `rake shadcn:check` のサマリに常に表示し、負債を可視化する。

## 9. テスト方針（抽出器自体）

- `tools/extractor` にはvitest等でユニットテストを用意する:
  - 代表的なTSXパターン（cva / cn / data-slot / compound / 条件レンダリング）の解析結果のスナップショット
  - **简退化させた固定フィクスチャTSX**に対する抽出結果の安定性テスト（リファクタしても抽出結果が変わらないことの保証）
- 生成→適合試験→コンポーネントスペックまで通るE2Eは、リポジトリのRSpec側（`spec/contracts/`）で検証する（[07-testing](07-testing.md) §6）
