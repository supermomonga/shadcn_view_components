# frozen_string_literal: true

require "rails_helper"

# アニメーションの upstream パリティ検証。
#
# visual parity(静的ピクセル比較)はアニメーションを停止して比較するため、
# 「開閉アニメーションが元の実装と同じである」ことは検証できない。この層は:
#   1. Capybara の UI 操作(click / hover)で両側のコンポーネントを開く
#   2. 直後に WAAPI(getAnimations)でアニメーションを取得して pause し、
#      currentTime を同一チェックポイント(0/25/50/75/100%)に固定する
#   3. 補間値(opacity / transform 行列 / 高さ)と、アニメーション名・持続時間・
#      イージングを比較する
# 時間を仮想化するため実行タイミングの影響を受けない(決定論的)。
#
# 通常の `bundle exec rspec` では実行されない(PARITY=1 が必要 — rake parity:run)。
# クリック系: evaluate_async_script(コールバック式)で click → 描画待ち → 取得を行う。
# React はイベント後の描画を非同期に flush するため少し待つ。アニメーション持続時間は
# 最短でも100msなので60ms待ちでも生存中に取得できる(取得後に時刻を固定するため
# 待ち時間の経過はチェックポイントの値に影響しない)
def animation_click_probe(trigger_selector, content_selector)
  t = JSON.generate(trigger_selector)
  c = JSON.generate(content_selector)
  <<~JS
    const done = arguments[arguments.length - 1]
    const trigger = document.querySelector(#{t})
    if (!trigger) {
      done({ error: "trigger missing" })
    } else {
      activate(trigger)
      setTimeout(() => {
        const content = document.querySelector(#{c})
        if (!content) {
          done({ error: "content missing" })
        } else {
          done(collect(content))
        }
      }, 60)
    }
  JS
end

# Radix 系のトリガーは pointerdown で開くため、実際のポインタ列を再現する
def animation_activate_helper
  <<~JS
    function activate(trigger) {
      for (const type of ["pointerdown", "pointerup", "click"]) {
        trigger.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }))
      }
    }
  JS
end

# hover系(tooltip / hover-card): 開くまでに遅延があるため、Capybara で hover した後
# このプローブをアニメーションが見つかるまで繰り返す(最初に見つかった瞬間に停止する)
def animation_collect_probe(content_selector)
  c = JSON.generate(content_selector)
  <<~JS
    (function() {
      const content = document.querySelector(#{c})
      if (!content) return { error: "content missing" }
      return collect(content)
    })()
  JS
end

# 共通: アニメーションを pause して currentTime をチェックポイントに固定し、
# 補間値(opacity / transform / height)を読む。時間を仮想化するため実タイミングに影響されない
def animation_collect_helper
  <<~JS
    function collect(content) {
      const animations = content.getAnimations().filter((anim) => {
        const name = anim.animationName ?? ""
        return name !== "" && name !== "none"
      })
      if (animations.length === 0) return { error: "no animation on content", state: content.dataset.state ?? null }
      const anim = animations[0]
      anim.pause()
      const timing = anim.effect.getTiming()
      const duration = timing.duration ?? 0
      const ease = timing.easing ?? "linear"

      const samples = []
      for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
        anim.currentTime = fraction * duration
        const cs = getComputedStyle(content)
        samples.push({ opacity: cs.opacity, transform: cs.transform, height: content.getBoundingClientRect().height })
      }
      return { name: anim.animationName, duration: duration, ease: ease, samples: samples, state: content.dataset.state ?? null }
    }
  JS
end

ANIMATION_SCENARIOS = [
  # ours/demo: プレビューのパスとデモID。trigger: 開く操作の対象。
  # action: click(既定)または hover(tooltip / hover-card)。
  # NOTE: upstream の accordion トリガーは button、うち側は summary(details移植)
  {
    ours: "shadcn/accordion/default", demo: "accordion/default",
    ours_trigger: "summary[data-slot='accordion-trigger']", upstream_trigger: "button[data-slot='accordion-trigger']",
    content: "[data-slot='accordion-content']"
  },
  {
    ours: "shadcn/dialog/default", demo: "dialog/default",
    ours_trigger: "button[data-slot='dialog-trigger']", upstream_trigger: "button[data-slot='dialog-trigger']",
    content: "[data-slot='dialog-content']"
  },
  {
    ours: "shadcn/sheet/default", demo: "sheet/default",
    ours_trigger: "button[data-slot='sheet-trigger']", upstream_trigger: "button[data-slot='sheet-trigger']",
    content: "[data-slot='sheet-content']"
  },
  # NOTE: drawer は upstream(vaul)がJSのバネ物理でアニメーションするためCSS等価が無く、
  # この検証の対象外(ネイティブ dialog への移植と引き換えにしている documented な差異)
  {
    ours: "shadcn/dropdown_menu/default", demo: "dropdown-menu/default",
    ours_trigger: "button[data-slot='dropdown-menu-trigger']", upstream_trigger: "button[data-slot='dropdown-menu-trigger']",
    content: "[data-slot='dropdown-menu-content']"
  },
  {
    ours: "shadcn/menubar/default", demo: "menubar/default",
    ours_trigger: "button[data-slot='menubar-trigger']", upstream_trigger: "button[data-slot='menubar-trigger']",
    content: "[data-slot='menubar-content']"
  },
  {
    ours: "shadcn/popover/default", demo: "popover/default",
    ours_trigger: "button[data-slot='popover-trigger']", upstream_trigger: "button[data-slot='popover-trigger']",
    content: "[data-slot='popover-content']"
  },
  {
    ours: "shadcn/tooltip/default", demo: "tooltip/default",
    ours_trigger: "button[data-slot='tooltip-trigger']", upstream_trigger: "button[data-slot='tooltip-trigger']",
    content: "[data-slot='tooltip-content']", action: "hover"
  },
  {
    ours: "shadcn/hover_card/default", demo: "hover-card/default",
    ours_trigger: "a[data-slot='hover-card-trigger']", upstream_trigger: "a[data-slot='hover-card-trigger']",
    content: "[data-slot='hover-card-content']", action: "hover"
  },
  {
    ours: "shadcn/combobox/default", demo: "combobox/default",
    ours_trigger: "button[data-slot='input-group-button']", upstream_trigger: "button[data-slot='input-group-button']",
    content: "[data-slot='combobox-content']"
  }
].freeze

def numericize_transform(matrix)
  return [] if matrix == "none"

  matrix.scan(/-?\d+(?:\.\d+)?(?:e-?\d+)?/).map(&:to_f)
end

def transform_close?(ours, upstream)
  a = numericize_transform(ours)
  b = numericize_transform(upstream)
  return ours == upstream if a.empty? || b.empty?

  a.size == b.size && a.each_index.all? { |i| (a[i] - b[i]).abs < 0.02 }
end

RSpec.describe "animation parity", :parity, type: :system do
  before do
    driven_by :shadcn_cuprite
    page.current_window.resize_to(1024, 768)
  end

  define_method(:open_and_collect) do |url, trigger_selector, content_selector, action|
    visit url
    # collect ヘルパをページのグローバルに置く(プローブから参照する)
    page.evaluate_script(animation_collect_helper.sub("function collect", "window.collect = function collect"))
    page.evaluate_script(animation_activate_helper.sub("function activate", "window.activate = function activate"))

    if action == "hover"
      page.find(trigger_selector).hover
      hover_until_animated(content_selector)
    else
      page.evaluate_async_script(animation_click_probe(trigger_selector, content_selector))
    end
  end

  # tooltip / hover-card は開くまでに遅延(0〜150ms)があるため、アニメーションが
  # 見つかるまで繰り返す。見つけた瞬間に停止・時刻固定するので取得タイミングは結果に影響しない
  define_method(:hover_until_animated) do |content_selector|
    deadline = Time.now + 2
    loop do
      result = page.evaluate_script(animation_collect_probe(content_selector))
      return result unless result.is_a?(Hash) && result.key?("error")

      raise "hover後2秒以内にアニメーションが始まりません: #{result.inspect}" if Time.now > deadline
    end
  end

  ANIMATION_SCENARIOS.each do |scenario|
    it "#{scenario.fetch(:ours)} の開くアニメーションが upstream(#{scenario.fetch(:demo)}) と一致する" do
      action = scenario.fetch(:action, "click")
      upstream = open_and_collect(
        "http://127.0.0.1:4173/?demo=#{scenario.fetch(:demo)}",
        scenario.fetch(:upstream_trigger), scenario.fetch(:content), action
      )
      ours = open_and_collect(
        "/lookbook/preview/#{scenario.fetch(:ours)}",
        scenario.fetch(:ours_trigger), scenario.fetch(:content), action
      )

      aggregate_failures do
        expect(upstream.key?("error")).to be(false), "upstream側でアニメーションを取得できません: #{upstream['error']}"
        expect(ours.key?("error")).to be(false), "うち側でアニメーションを取得できません: #{ours['error']}"

        # tw-animate を共用するためキーフレーム名・イージングは一致し、持続時間は契約クラス由来
        expect(ours.fetch("name")).to eq(upstream.fetch("name"))
        expect(ours.fetch("ease")).to eq(upstream.fetch("ease"))
        expect(ours.fetch("duration")).to be_within(1).of(upstream.fetch("duration"))

        upstream_samples = upstream.fetch("samples")
        ours_samples = ours.fetch("samples")
        ours_samples.each_with_index do |sample, i|
          expected = upstream_samples.fetch(i)
          expect((sample.fetch("opacity").to_f - expected.fetch("opacity").to_f).abs).to be < 0.02,
                                                                                         "opacity が checkpoints[#{i}] で不一致: ours=#{sample['opacity']} upstream=#{expected['opacity']}"
          expect(transform_close?(sample.fetch("transform"), expected.fetch("transform"))).to be(true),
                                                                                              "transform が checkpoints[#{i}] で不一致: ours=#{sample['transform']} upstream=#{expected['transform']}"

          # 高さはアニメーション形状(0→最終高さへの補間割合)を比較する。
          # 絶対高さ(開状態のレイアウト)は静的な層の担当であり、ここでは
          # 相対値の一致(= 同じキーフレーム形状)を検証する
          ours_final = ours_samples.fetch(4).fetch("height")
          upstream_final = upstream_samples.fetch(4).fetch("height")
          next if ours_final.zero? || upstream_final.zero?

          ours_ratio = sample.fetch("height") / ours_final
          upstream_ratio = expected.fetch("height") / upstream_final
          expect((ours_ratio - upstream_ratio).abs).to be < 0.03,
                                                       "height(正規化) が checkpoints[#{i}] で不一致: ours=#{ours_ratio.round(3)} upstream=#{upstream_ratio.round(3)}"
        end
      end
    end
  end
end
