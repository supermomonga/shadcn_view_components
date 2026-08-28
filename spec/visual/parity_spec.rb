# frozen_string_literal: true

require "rails_helper"
require "open3"

# 見た目の upstream パリティ検証(ビジュアルリグレッション)。
#
# vendor/shadcn の React実装(upstream)を Vite で描画した結果と、
# Lookbook プレビュー(dummy)の描画結果を同じCuprite(Chromium)で
# スクリーンショットし、pixelmatch でピクセル比較する。
# 「クラス文字列の一致」は契約/整合スペックが、「DOM構造」はコンポーネント
# スペックが保証しており、この層はその先の「CSS適用結果を含めた見た目」の
# 差分検出を担う。
#
# 通常の `bundle exec rspec` では実行されない(重い・Node依存のため)。
# 実行:   bundle exec rake parity:run(または mise run parity)
# 閾値:   PARITY_RATIO(既定 0.005 = 0.5%)を超える差分で失敗
PARITY_BASELINES = File.expand_path("baselines", __dir__)
PARITY_COMPARE = File.expand_path("../../tools/visual-parity/compare.mjs", __dir__)
PARITY_THRESHOLD = (ENV.fetch("PARITY_RATIO", nil) || "0.005").to_f
PARITY_SCENARIOS = [
  # [lookbookプレビューのパス, upstreamデモID]
  %w[shadcn/accordion/default accordion/default],
  %w[shadcn/alert/default alert/default],
  %w[shadcn/avatar/default avatar/default],
  %w[shadcn/badge/default badge/default],
  %w[shadcn/badge/variants badge/variants],
  %w[shadcn/button/default button/default],
  %w[shadcn/card/default card/default],
  %w[shadcn/label/default label/default],
  %w[shadcn/separator/horizontal separator/horizontal],
  %w[shadcn/skeleton/default skeleton/default],
  %w[shadcn/switch/default switch/default],
  %w[shadcn/tabs/default tabs/default],
  %w[shadcn/tooltip/default tooltip/default]
].freeze

# スクリーンショットの保存はこの検証の本題(Lint/Debugger は spec/visual を対象外にしている)
def parity_capture(page, body_path)
  # animate-pulse 等の非決定性を両側で同じように止めてからbody要素を撮る
  # (Cuprite の selector: オプションで要素単位のスクリーンショットになる)
  page.execute_script(
    "const s=document.createElement('style');s.textContent='*{animation:none!important;transition:none!important}';document.head.append(s)"
  )
  page.save_screenshot(body_path, selector: "body")
end

RSpec.describe "visual parity", :parity, type: :system do
  before do
    driven_by :shadcn_cuprite
    page.current_window.resize_to(1024, 768)
  end

  PARITY_SCENARIOS.each do |ours_path, demo_id|
    it "#{ours_path} が upstream(#{demo_id}) と一致する" do
      dir = File.join(PARITY_BASELINES, demo_id.tr("/", "-"))
      FileUtils.mkdir_p(dir)
      ours_png = File.join(dir, "ours.png")
      upstream_png = File.join(dir, "upstream.png")
      diff_png = File.join(dir, "diff.png")
      report_json = File.join(dir, "report.json")

      visit "http://127.0.0.1:4173/?demo=#{demo_id}"
      parity_capture(page, upstream_png)

      visit "/lookbook/preview/#{ours_path}"
      parity_capture(page, ours_png)

      out, status = Open3.capture2e("node", PARITY_COMPARE, ours_png, upstream_png, diff_png, report_json, PARITY_THRESHOLD.to_s)
      report = JSON.parse(File.read(report_json))
      expect(report.fetch("pass")).to be(true), <<~MSG
        #{ours_path} のupstreamとの差分率が閾値(#{PARITY_THRESHOLD})を超えました: #{report['ratio']}

        #{"#{out}\n" unless status.success?}
        baseline: #{dir}
          ours.png / upstream.png / diff.png(赤=差分ピクセル)
      MSG
    end
  end
end
