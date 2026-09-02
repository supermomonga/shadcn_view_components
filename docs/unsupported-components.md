# 非対応コンポーネントと代替（questionnaire / toast）

- ステータス: **Current**（現行の提供範囲と判断を記述する利用者向け資料）
- 対象読者: 本gemを利用するRails開発者
- 関連ドキュメント: [00-overview](00-overview.md) / [05-stimulus-hotwire](05-stimulus-hotwire.md) / [07-testing](07-testing.md) / [コンポーネントAPIリファレンス](components/README.md)

---

## 1. 提供範囲の管理方法

upstream（`vendor/shadcn/manifest.json`、base-novaスタイル）の63アイテムのうち、61を実装し、
`questionnaire`と`toast`の2つを**理由付き非対応**としている。判断の正本は
[spec/conformance/registry.yml](../spec/conformance/registry.yml)であり、各エントリは次のいずれかを
厳密に1つだけ持つ:

| 状態 | 意味 | 必須キー |
|---|---|---|
| `exports` | 実装済み（適合試験・coverage・docs生成の対象） | `exports` |
| `unsupported` | 意図的な非対応（「実装漏れ」とは区別される） | `reason` / `alternatives` / `reviewed_sha256` |

- `alternatives` は実装済みアイテムのみを参照でき、`spec/contracts/registry_status_spec.rb` が形式・
  参照先・SHAを機械検証する。
- `reviewed_sha256` は非対応判断時のupstream itemのSHAである。upstream同期で
  `vendor/shadcn/manifest.json` の `items.<name>.sha256` と乖離した時点で検証が失敗し、
  **判断の再評価が強制される**。
- `pending` などの未確定状態は存在しない。未実装のまま放置されたアイテムはCIで赤になる。

### 再評価のトリガ

1. 対象アイテムのupstream SHAが変わった場合（`reviewed_sha256`の不一致として検知）
2. `questionnaire`について、上記のサーバー主導フローでは満たせない具体的な共通要件が繰り返し提示された場合
3. 現行のSonner / Alertでは対応できない通知要件（§4の非対応機能を参照）が発生した場合

## 2. `questionnaire` — 非対応

**理由**: upstreamの公開仕様（docs / registry item）は入手でき、評価することは可能である。実際、
upstreamは現在のstep・回答値・単一/複数選択・自由入力・validation・前後移動・skip・submitを
`@shadcn/react`パッケージ内の一つの状態機械として所有する。ただしその状態機械の実体は
実行可能な依存としてvendor snapshotへ含まれず、Rails向けに再実装するには本gem独自の状態モデルを
定義・保守することになる。**より重要な点として、upstreamの状態機械に寄せる反復的な共通要件が
Rails側には存在しない**。単発の個別要件のために、upstream同期の恩恵を受けられない独自仕様の
状態管理を始める根拠がない。

**代替アイテム**: `form` / `field` / `input` / `radio-group` / `checkbox` / `button` / `progress`

複数ステップの進行管理はgemではなく**アプリ側（controller・form object・session）の責務**とする。

### 設計原則: サーバー主導の複数ステップフォーム

upstreamのクライアント内状態機械の代わりに、Rails標準の往復だけで同等のユーザージャーニーを組める:

- **1 step = 1リクエスト**（POST-Redirect-GET）。サーバーが唯一の状態源。
- **活性stepだけをSSRで描画**するため、JavaScript無効でも完結する。
- 値はsessionへ保存し、**前のstepへ戻ると保存済みの値で復元**する。
- 検証成功で次へ進み、失敗時は**HTTP 422で同じstepを入力値・エラー付きで再描画**する。

### レシピ: form object + session

`input` / `checkbox` / `radio-group` の3種類の入力を含む3ステップの例。

```ruby
# app/models/survey_form.rb — stepごとの検証だけを持つフォームオブジェクト
class SurveyForm
  include ActiveModel::Model

  STEPS = %w[profile choices confirm].freeze
  TOPICS = %w[design rails performance].freeze
  RATINGS = (1..5).map(&:to_s).freeze
  STEP_FIELDS = {
    "profile" => %w[name email],
    "choices" => %w[topics rating],
    "confirm" => %w[confirmed]
  }.freeze

  attr_accessor :name, :email, :topics, :rating, :confirmed

  # 検証はstepが進むほど累積する(前stepの回答が壊れたまま次へ進むのを防ぐ)
  validates :name, presence: true, if: -> { step_index >= 0 }
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }, if: -> { step_index >= 0 }
  validates :topics, presence: true, if: -> { step_index >= 1 }
  validates :rating, inclusion: { in: RATINGS }, if: -> { step_index >= 1 }
  validates :confirmed, acceptance: true, if: -> { step_index >= 2 }

  def initialize(attributes = {}, step: STEPS.first)
    super(attributes)
    @step = STEPS.include?(step.to_s) ? step.to_s : STEPS.first
    self.topics = Array(topics)
  end

  attr_reader :step

  def step_index = STEPS.index(@step)

  def next_step = STEPS[step_index + 1]

  def previous_step = STEPS[step_index - 1]
end
```

```ruby
# app/controllers/survey_controller.rb
class SurveyController < ApplicationController
  STEPS = SurveyForm::STEPS

  # 戻る・直接アクセス: sessionの保存済み回答から復元して再描画する
  def show
    step = normalize_step(params[:step])
    @form = SurveyForm.new(saved_answers, step: step)
    furthest = furthest_reachable_step
    redirect_to survey_step_path(furthest) if STEPS.index(step) > STEPS.index(furthest)
  end

  # 進む・確定: 1 step = 1リクエスト
  def update
    step = normalize_step(params[:step])
    @form = SurveyForm.new(saved_answers, step: step)
    @form.assign_attributes(survey_params)

    # 前stepの回答が未完了のままの送信も、累積検証が422で弾く
    return render :show, status: :unprocessable_entity unless @form.valid?

    store_answers(@form)
    if step == STEPS.last
      # 最終送信でのみ永続化する
      SurveyAnswer.create!(name: @form.name, email: @form.email, topics: @form.topics, rating: @form.rating)
      session.delete(:survey)
      redirect_to root_path, notice: "回答を受け付けました"
    else
      redirect_to survey_step_path(@form.next_step)
    end
  end

  private

  def normalize_step(raw)
    STEPS.include?(raw) ? raw : STEPS.first
  end

  def survey_params
    params.require(:survey_form).permit(:name, :email, :rating, :confirmed, topics: [])
  end

  def saved_answers
    session[:survey] || {}
  end

  # 最初に検証が失敗するstep = ユーザーの現在地
  def furthest_reachable_step
    STEPS.find { |step| !SurveyForm.new(saved_answers, step: step).valid? } || STEPS.last
  end

  # 検証済みstepの回答だけをsessionへ反映する
  def store_answers(form)
    fields = SurveyForm::STEP_FIELDS.fetch(form.step)
    session[:survey] = saved_answers.merge(fields.index_with { |field| form.public_send(field) })
  end
end
```

```ruby
# config/routes.rb
get "survey/(:step)", to: "survey#show", as: :survey_step
patch "survey/:step", to: "survey#update"
```

```erb
<%# app/views/survey/show.html.erb — 活性stepだけを描画する %>
<%= render Shadcn::Progress.new(
      value: ((@form.step_index + 1) / SurveyForm::STEPS.size.to_f * 100).round,
      aria: { label: "アンケート進捗" }) %>

<%= form_with model: @form, url: survey_step_path(@form.step), method: :patch do %>
  <% if @form.step == "profile" %>
    <%= render Shadcn::Field.new do %>
      <%= render Shadcn::Field::Label.new(for: "survey_name") { "名前" } %>
      <%= render Shadcn::Input.new(id: "survey_name", name: "survey_form[name]",
                                   value: @form.name,
                                   aria: { invalid: @form.errors[:name].any? }) %>
      <%= render Shadcn::Form::Error.new(errors: @form.errors.full_messages_for(:name)) %>
      <%= render Shadcn::Field::Label.new(for: "survey_email") { "メールアドレス" } %>
      <%= render Shadcn::Input.new(id: "survey_email", type: "email", name: "survey_form[email]",
                                   value: @form.email,
                                   aria: { invalid: @form.errors[:email].any? }) %>
      <%= render Shadcn::Form::Error.new(errors: @form.errors.full_messages_for(:email)) %>
    <% end %>

  <% elsif @form.step == "choices" %>
    <fieldset>
      <legend>関心のあるトピック（複数選択）</legend>
      <% SurveyForm::TOPICS.each do |topic| %>
        <label>
          <%= render Shadcn::Checkbox.new(id: "survey_topics_#{topic}",
                                          name: "survey_form[topics][]",
                                          value: topic,
                                          checked: @form.topics.include?(topic)) %>
          <%= topic %>
        </label>
      <% end %>
      <%= render Shadcn::Form::Error.new(errors: @form.errors.full_messages_for(:topics)) %>
    </fieldset>
    <%= render Shadcn::RadioGroup.new(aria: { label: "評価" }) do %>
      <% SurveyForm::RATINGS.each do |rating| %>
        <label>
          <%= render Shadcn::RadioGroup::Item.new(id: "survey_rating_#{rating}",
                                                  name: "survey_form[rating]",
                                                  value: rating,
                                                  checked: @form.rating == rating) %>
          <%= rating %>
        </label>
      <% end %>
    <% end %>
    <%= render Shadcn::Form::Error.new(errors: @form.errors.full_messages_for(:rating)) %>

  <% else %>
    <label>
      <%= render Shadcn::Checkbox.new(id: "survey_confirmed", name: "survey_form[confirmed]",
                                      value: "1", checked: @form.confirmed.present?) %>
      内容を確認しました
    </label>
    <%= render Shadcn::Form::Error.new(errors: @form.errors.full_messages_for(:confirmed)) %>
  <% end %>

  <%# 戻るはGETリンク。前stepの表示はsessionの保存済み値で復元される %>
  <% if @form.step_index > 0 %>
    <%= link_to "戻る", survey_step_path(@form.previous_step) %>
  <% end %>
  <%= render Shadcn::Button.new(type: :submit) { @form.step == SurveyForm::STEPS.last ? "送信" : "次へ" } %>
<% end %>
```

このレシピは次の要件を満たす:

| 要件 | 実現方法 |
|---|---|
| 1 step = 1リクエスト | `show` / `update`の往復（PRG）。状態はsessionのみ |
| 活性stepだけを描画 | `show.html.erb`の`if`分岐。非活性stepのDOMは存在しない |
| 検証成功で前進 | `valid?`後にsessionへ保存して次stepへredirect |
| HTTP 422で再描画 | `render :show, status: :unprocessable_entity`。入力値とエラーがそのまま出る |
| 戻るで状態復元 | GETリンク → sessionの保存済み回答で`value` / `checked`を復元 |
| 最終送信で永続化 | 最終stepの検証成功時にのみ`create!` |
| JavaScript無効で動作 | 全てがフォーム送信とリンク。Stimulusに依存しない |

ステップ内の一時的なインタラクション（選択の排他など）は`radio-group` / `checkbox`が
ネイティブinputとして動作するため追加のJSを不要とする。より高度なインタラクションが
必要になった時点で、その要件を具えて再評価する。

## 3. `toast` — 非対応（通知はSonnerへ一本化）

**理由**: base-novaでは`toast`（Base UI専用）が通知の正本だが、本gemは**意図的に差異**を置き、
既存のSonner実装を唯一の通知APIとする。Provider・表示領域・タイマー管理が既存Sonner実装と
重複し、通知APIを2系統提供すると利用者が選択に迷い、二重保守のコストも発生するため。
操作を伴う通知や、自動で消すべきでない重要情報には`Shadcn::Alert`を案内する。

### 通知の使い方（現行API・変更なし）

layoutへ`Shadcn::Sonner::Toaster`を**1つだけ**置く:

```erb
<%# app/views/layouts/application.html.erb %>
<%= render Shadcn::Sonner::Toaster.new(aria: { label: "通知" }) %>
```

通知は`shadcn:toast` CustomEventで送出する。`detail`のキーは`title` / `description` / `duration`:

```js
// durationはミリ秒。省略時は4000。0で自動消去なし
dispatchEvent(new CustomEvent("shadcn:toast", {
  detail: { title: "保存しました", description: "変更は即時に反映されます", duration: 4000 }
}))
```

- Stimulus識別子は`shadcn--toast`、イベント名は`shadcn:toast`。
- 文字列はテキストとして挿入される（HTMLは解釈されない）。
- `aria-live="polite"`の領域へ`role="status"`の通知を追加する。

> **注意**: `duration: 0`の通知はタイマーが存在せず、Close buttonも非対応のため手動では消せない。
> 画面に残し続けるべき永続的・重要な内容は通知ではなく`Shadcn::Alert`を使うこと。

### 操作を伴う通知・重要情報の代替

リンクやボタンを伴う通知、画面に留めるべき重要情報は通知ではなく`Shadcn::Alert`で
静的に提示する。アクションを伴うなら対象ページへ誘導するか、dialog / `Shadcn::Button`と
組み合わせた明示的なUIを構成する。

### 現行Sonnerの非対応機能（正直な一覧）

upstreamの`toast` / sonnerライブラリと比較して、現行実装は次の機能を持たない:

| 機能 | 状況 |
|---|---|
| Actionボタン（通知上の操作） | 非対応。`Shadcn::Alert`やdialogで代替 |
| Close button（通知の手動クローズ） | 非対応。通知はduration経由でのみ消える |
| type / priority（success / error等の区分、`role="alert"`切替） | 非対応。全通知が`role="status"` |
| pause on hover / focus / 非表示タブ | 非対応。タイマーは送出時に開始される |
| swipe dismiss | 非対応 |
| promise / loading状態の通知 | 非対応 |

これらは既知の限界として記録しており、必要になった時点で§1のトリガ3により再評価する。

### 既知の限界: 手書きクラス

`app/assets/javascripts/shadcn/controllers/toast_controller.js`は通知要素のクラス文字列を
手書きしている。これは「クラス定義を生成契約由来のみとする」原則（04 §7）に対する**既知の限界**
であり、他コンポーネントで手書きクラスを許す前例ではない。
