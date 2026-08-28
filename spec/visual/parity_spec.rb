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
# calendar は手書き実装(10-roadmap: 抽出対象外)で、upstream は react-day-picker の
# 描画結果のため厳密な像素一致は対象外。概形一致(枠・曜日行・日付グリッド・選択表示)を
# 緩い閾値(2%)で保証する。第3要素でシナリオ個別の閾値を上書きできる
PARITY_SCENARIOS = [
  # [lookbookプレビューのパス, upstreamデモID, (省略可)個別閾値]
  %w[shadcn/accordion/default accordion/default],
  %w[shadcn/alert_dialog/default alert-dialog/default],
  %w[shadcn/alert/default alert/default],
  %w[shadcn/alert/destructive alert/destructive],
  %w[shadcn/aspect_ratio/default aspect-ratio/default],
  %w[shadcn/avatar/default avatar/default],
  %w[shadcn/avatar/group avatar/group],
  %w[shadcn/avatar/sizes avatar/sizes],
  %w[shadcn/badge/default badge/default],
  %w[shadcn/badge/variants badge/variants],
  %w[shadcn/breadcrumb/default breadcrumb/default],
  %w[shadcn/breadcrumb/ellipsis breadcrumb/ellipsis],
  %w[shadcn/button/as_link button/as-link],
  %w[shadcn/button/default button/default],
  %w[shadcn/button/destructive button/destructive],
  %w[shadcn/button/ghost button/ghost],
  %w[shadcn/button/link button/link],
  %w[shadcn/button/outline button/outline],
  %w[shadcn/button/sizes button/sizes],
  %w[shadcn/button/variants button/variants],
  %w[shadcn/button/with_icon button/with-icon],
  %w[shadcn/calendar/default calendar/default 0.02],
  %w[shadcn/calendar/plain calendar/plain 0.02],
  %w[shadcn/card/default card/default],
  %w[shadcn/card/with_action card/with-action],
  %w[shadcn/carousel/default carousel/default],
  %w[shadcn/checkbox/default checkbox/default],
  %w[shadcn/checkbox/disabled checkbox/disabled],
  %w[shadcn/collapsible/default collapsible/default],
  %w[shadcn/combobox/chips combobox/chips],
  %w[shadcn/combobox/default combobox/default],
  %w[shadcn/command/default command/default],
  %w[shadcn/context_menu/default context-menu/default],
  %w[shadcn/dialog/default dialog/default],
  %w[shadcn/drawer/default drawer/default],
  %w[shadcn/dropdown_menu/default dropdown-menu/default],
  %w[shadcn/empty/default empty/default],
  %w[shadcn/form/default form/default],
  %w[shadcn/form/without_message form/without-message],
  %w[shadcn/hover_card/default hover-card/default],
  %w[shadcn/input/default input/default],
  %w[shadcn/input/disabled input/disabled],
  %w[shadcn/item/default item/default],
  %w[shadcn/kbd/default kbd/default],
  %w[shadcn/kbd/group kbd/group],
  %w[shadcn/label/default label/default],
  %w[shadcn/label/with_input label/with-input],
  %w[shadcn/marker/default marker/default],
  %w[shadcn/marker/variants marker/variants],
  %w[shadcn/menubar/default menubar/default],
  %w[shadcn/navigation_menu/default navigation-menu/default],
  %w[shadcn/navigation_menu/with_trigger navigation-menu/with-trigger],
  %w[shadcn/pagination/default pagination/default],
  %w[shadcn/popover/default popover/default],
  %w[shadcn/radio_group/default radio-group/default],
  %w[shadcn/resizable/default resizable/default],
  %w[shadcn/scroll_area/default scroll-area/default],
  %w[shadcn/separator/horizontal separator/horizontal],
  %w[shadcn/separator/vertical separator/vertical],
  %w[shadcn/sheet/default sheet/default],
  %w[shadcn/skeleton/default skeleton/default],
  %w[shadcn/spinner/default spinner/default],
  %w[shadcn/spinner/large spinner/large],
  %w[shadcn/switch/default switch/default],
  %w[shadcn/switch/small switch/small],
  %w[shadcn/table/default table/default],
  %w[shadcn/tabs/default tabs/default],
  %w[shadcn/tabs/line tabs/line],
  %w[shadcn/textarea/default textarea/default],
  %w[shadcn/toggle/default toggle/default],
  %w[shadcn/toggle/pressed toggle/pressed],
  %w[shadcn/toggle/sizes toggle/sizes],
  %w[shadcn/toggle/variants toggle/variants],
  %w[shadcn/toggle_group/multiple toggle-group/multiple],
  %w[shadcn/toggle_group/single toggle-group/single],
  %w[shadcn/tooltip/default tooltip/default]
].freeze

# スクリーンショットの保存はこの検証の本題(Lint/Debugger は spec/visual を対象外にしている)
def parity_capture(page, body_path)
  # animate-pulse 等の非決定性を両側で同じように止めてからbody要素を撮る
  # (Cuprite の selector: オプションで要素単位のスクリーンショットになる)。
  # 内容が表示高さ0のときも要素撮影が失敗しないよう最小高さを両側で同値に保証する
  page.execute_script(
    "const s=document.createElement('style');s.textContent='*{animation:none!important;transition:none!important}';document.head.append(s);" \
    "document.body.style.minHeight='1px'"
  )
  page.save_screenshot(body_path, selector: "body")
end

RSpec.describe "visual parity", :parity, type: :system do
  before do
    driven_by :shadcn_cuprite
    page.current_window.resize_to(1024, 768)
  end

  PARITY_SCENARIOS.each do |ours_path, demo_id, scenario_threshold|
    threshold = scenario_threshold || PARITY_THRESHOLD
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

      out, status = Open3.capture2e("node", PARITY_COMPARE, ours_png, upstream_png, diff_png, report_json, threshold.to_s)
      report = JSON.parse(File.read(report_json))
      expect(report.fetch("pass")).to be(true), <<~MSG
        #{ours_path} のupstreamとの差分率が閾値(#{threshold})を超えました: #{report['ratio']}

        #{"#{out}\n" unless status.success?}
        baseline: #{dir}
          ours.png / upstream.png / diff.png(赤=差分ピクセル)
      MSG
    end
  end
end
