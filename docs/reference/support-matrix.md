# 11 — サポートmatrix（Ruby・Rails・Node・ブラウザ）

- ステータス: **Current**（現行実装の保守者向け設計資料）
- 対象読者: 本ライブラリの利用者・CI管理者
- 関連ドキュメント: [00-overview](overview.md) / [05-stimulus-hotwire](stimulus-hotwire.md) / [07-testing](testing.md) / [09-ci-drift-detection](ci-drift-detection.md)

---

## 1. 方針

| 項目 | 方針 |
|---|---|
| 正本 | この文書の表がサポート範囲の正本。gemspec・CI・[ルートREADME](../../README.md)は同じmatrixを表す |
| CI | **基本は最新リリース版でのみ検証する**（CIコストの判断）。下限組み合わせは既存job内での軽量spec再実行によってのみ検証し、matrixジョブは作らない |
| 上限 | gemspecは悲観的演算子（`~>`）でmajorを抑える。未検証のmajorを無制限に許容しない |
| ブラウザ | 下限はBaseline 2024。**polyfillは提供しない**（[ADR 0008](../adr/0008-reimplement-client-behavior-with-stimulus-and-native-html.md)のネイティブ最優先方針）。CIでの機械検証は最新Chromeのみ |

## 2. ツールチェーンmatrix

### ホストアプリケーションが必要とするもの（gemspec Runtime Dependencies）

| 依存 | gemspec制約 | 下限（minimum.gemfileで検証） | CIで検証する最新版 |
|---|---|---|---|
| Ruby | `>= 4.0.0` | 4.0系のみサポート | 4.0系最新（mise） |
| rails | `~> 8.1` | 8.1.0 | 8.1系最新（Gemfile.lock） |
| view_component | `~> 4.1` | 4.1.0 | 4系最新 |
| tailwindcss-rails | `~> 4.3` | 4.3.0 | 4系最新 |
| tailwind_merge | `~> 1.5` | 1.5.0 | 1.5系最新 |
| sorbet-runtime | `~> 0.6` | 0.6系 | 0.6系最新 |

- **view_componentの下限が4.1である理由**: 4.0系は`activesupport < 8.1`を要求するためRails 8.1と組み合わせられず、`rails >= 8.1`環境では解決不能になる。Rails 8.1で実際に解決・動作する下限は4.1.0。
- Rubyはfloorのみを宣言する（Rubyコミュニティの慣行。上限capは設けない）。サポートするのは4.0系のみで、Ruby 4.1はrelease後に検証して範囲へ追加する。
- 同一major内のminor・patch releaseはgemspecの許容範囲に入る。major update（Rails 9、view_component 5等）はCIで検証してから制約を緩める。

### リポジトリ開発で必要なもの（dev toolchain）

| ツール | バージョン | 固定場所 |
|---|---|---|
| Node | 24（LTS） | `mise.toml`（major固定）・ルート`package.json`の`engines` |
| pnpm | 10.22.0 | `mise.toml`・各`package.json`の`packageManager` |

- Nodeの`lts`エイリアスは次のLTS登場時（2026年10月のNode 26 LTS化）に解決先が浮動するため、検証するmajorを直接固定する。
- pnpmを`latest`で導入していた時代のmajor updateによるCI再現不能は、`packageManager` + mise固定（[pnpm toolchain契約](../../spec/contracts/pnpm_toolchain_spec.rb)が両者の一致を検査）で解決済み。

## 3. CIでの検証構成

| 環境 | どこで実行されるか | 内容 |
|---|---|---|
| 最新版（単一環境） | 全8job | mise（Ruby 4.0 / Node 24 / pnpm 10.22.0）+ `Gemfile.lock`の最新解決でフル検査 |
| 下限組み合わせ | `rspec` / `tailwind-build` jobのみ | `VERIFY_MINIMUM=1`が`gemfiles/minimum.gemfile`（rails 8.1.0 / view_component 4.1.0 / tailwindcss-rails 4.3.0 / tailwind_merge 1.5.0）で`bundle install`し、component・contract・Tailwind build specを再実行する |

- matrixジョブ・追加jobは作らない。job構成（8必須check）は変更しない。
- ローカルの`bundle exec rake verify`では`VERIFY_MINIMUM`が設定されないため、下限再実行はスキップされる。明示的に確認するときは`VERIFY_MINIMUM=1 bundle exec rake verify:spec verify:tailwind`。

## 4. ブラウザサポート

### 下限: Baseline 2024

必須APIのなかで最も新しいのが**Popover API**（`popover`属性・`showPopover()`・`:popover-open`）で、これがサポート下限の拘束条件になる。他の必須APIはすべてPopover APIより前にクロスブラウザで利用可能:

| 必須API | Chrome/Edge | Safari | Firefox | 主な利用箇所 |
|---|---|---|---|---|
| Popover API（**拘束条件**） | 114+ | 17+ | 125+ | popover / select / menu系 / combobox / tooltip |
| `<dialog>` + `showModal()` / `inert` | 102+ | 15.4+ | 112+ | dialog / alert-dialog / sheet / drawer |
| `:has()` / `color-mix()` / `oklch()` | 111+ | 16.2+ | 113+ | Tailwind v4トークン・table / button-group |
| `dvh`ビューポート単位 / `crypto.randomUUID` | 108+ / 92+ | 15.4+ | 101+ / 95+ | drawer / ARIA関係の自動ID |

Baseline 2024を満たさないブラウザ（Chrome 113以前、Safari 16以前、Firefox 124以前）はサポート対象外。**polyfillは提供しない**。

### 漸進的拡張（未対応ブラウザでは機能が落ちるが壊れない）

| 機能 | 対応状況 | 利用箇所 | 未対応環境での挙動 |
|---|---|---|---|
| `interpolate-size: allow-keywords` | Chromiumのみ（Chrome 129+） | drawerの高さアニメーション | アニメーションせず即時に開閉 |
| scroll-driven animations（`animation-timeline: scroll()`） | Chrome 115+、他は未対応または新しい | scroll-areaのフェード | `@supports`で静的なマスクへfallback（`shadcn.css`に実装済み） |
| `field-sizing: content` | Baseline 2026（Chrome 123+ / Safari 18.4+ / Firefox 138+） | textareaの内容追従リサイズ | 固定サイズのtextareaとして動作 |
| `@starting-style` / `transition-behavior: allow-discrete` | Chrome 117+ / Safari 17.5+ / Firefox 129+ | accordion / sheet / navigation-menu等の開閉アニメーション（tw-animate-css） | アニメーションなしで即時に表示 |

新しいCSS機能を追加するときは、この表のいずれかに分類できること（すべての利用者に必須、または漸進的拡張）を要件にする。

### 検証方法

- CI（`system` / `parity` job）は最新Chrome（Cuprite + `browser-actions/setup-chrome`）でのみ機械検証する。
- Safari / Firefoxは上表のAPI監査に基づくサポート宣言であり、CIでのクロスブラウザ検証は行わない（コストの判断）。
- JavaScript無効時のfallback tierは[05-stimulus-hotwire](stimulus-hotwire.md)を参照。

## 5. 更新手順

サポート範囲を変更するときは、正本の表・gemspec・`gemfiles/minimum.gemfile`（+lock）・[ルートREADME](../../README.md)の表示を同じcommitで更新する。

1. **新しいmajorへ対応するとき**: minimum.gemfileと`Gemfile.lock`を更新してCIで検証 → gemspecの`~>`を緩める → 表を更新
2. **下限を引き上げるとき**: minimum.gemfileのピンを引き上げて検証 → gemspecの`~>`の下限を更新 → 表を更新
3. **ブラウザAPIを追加するとき**: §4の該当表へ追加（漸進的拡張に該当しない場合はBaseline 2024下限と両立するかを確認）
