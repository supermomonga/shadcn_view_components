# frozen_string_literal: true

require "rails_helper"
require "open3"
require_relative "../support/parity_artifacts"

# 見た目の upstream パリティ検証(ビジュアルリグレッション)。
#
# vendor/shadcn の React実装(upstream)を Vite で描画した結果と、
# Lookbook プレビュー(dummy)の描画結果を同じCuprite(Chromium)で
# スクリーンショットし、pixelmatch でピクセル比較する。
# 「クラス文字列の一致」は契約/整合スペックが、「DOM構造」はコンポーネント
# スペックが保証しており、この層はその先の「CSS適用結果を含めた見た目」の
# 差分検出を担う。
#
# 素の `bundle exec rspec` でも常時実行される(upstream参照サーバのビルドと
# 起動は spec/support/parity_server.rb が行う。明示的に外すときは PARITY=0)。
# 実行:   bundle exec rspec spec/visual(または rake parity:run / mise run parity)
# baseline更新: bundle exec rake parity:update(この明示コマンドだけが追跡ファイルへ書く)
# 閾値:   PARITY_RATIO(既定 0.005 = 0.5%)を超える差分で失敗
PARITY_COMPARE = File.expand_path("../../tools/visual-parity/compare.mjs", __dir__)
PARITY_THRESHOLD = (ENV.fetch("PARITY_RATIO", nil) || "0.005").to_f
# 各シナリオを light/dark 両カラースキームで撮る。ダークでしか発火しない
# dark:* ユーティリティ(dark:bg-destructive/60 等)や .dark トークンの差分も
# このモードでしか検出できない(ライトのみだと盲点になる: dark はクラスベースで
# Lookbook プレビューには .dark が付かないため、通常描画は常にライトになる)
PARITY_MODES = %i[light dark].freeze
# calendar は手書き実装(10-roadmap: 抽出対象外)で、upstream は react-day-picker の
# 描画結果のため厳密な像素一致は対象外。概形一致(枠・曜日行・日付グリッド・選択表示)を
# 緩い閾値(2%)で保証する。第3要素でシナリオ個別の閾値を上書きできる
# calendar の手書き実装は upstream と高さ差がある(白背景では比較パディングの白に溶けるが、
# dark では背景が黒く出るため同じ差が差分ピクセルとして計上される)。概形一致の保証水準を
# light に揃えるため、このシナリオは dark だけ閾値をさらに緩める
PARITY_DARK_THRESHOLDS = {
  "calendar/default" => 0.06,
  "calendar/plain" => 0.06
}.freeze

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
  %w[shadcn/field/default field/default],
  %w[shadcn/field/horizontal field/horizontal],
  %w[shadcn/form/default form/default],
  %w[shadcn/form/without_error form/without-error],
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
  %w[shadcn/resizable/vertical resizable/vertical],
  %w[shadcn/scroll_area/default scroll-area/default],
  %w[shadcn/select/default select/default],
  %w[shadcn/separator/horizontal separator/horizontal],
  %w[shadcn/separator/vertical separator/vertical],
  %w[shadcn/sheet/default sheet/default],
  %w[shadcn/skeleton/default skeleton/default],
  %w[shadcn/slider/default slider/default],
  %w[shadcn/slider/vertical slider/vertical],
  %w[shadcn/spinner/default spinner/default],
  %w[shadcn/spinner/large spinner/large],
  %w[shadcn/switch/default switch/default],
  %w[shadcn/switch/small switch/small],
  %w[shadcn/table/default table/default],
  %w[shadcn/tabs/default tabs/default],
  %w[shadcn/tabs/line tabs/line],
  %w[shadcn/tabs/vertical tabs/vertical],
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
def parity_capture(page, body_path, dark: false, min_height: 1)
  # animate-pulse 等の非決定性を両側で同じように止めてからbody要素を撮る
  # (Cuprite の selector: オプションで要素単位のスクリーンショットになる)。
  # 内容が表示高さ0のときも要素撮影が失敗しないよう最小高さを両側で同値に保証する。
  # プレビュー専用レイアウトが付与するbodyの余白は比較対象外のため、両側で同じように
  # 打ち消してから撮る(upstream側は余白なしなので実質うち側だけ効く)。
  # dark モードではさらに .dark を <html> に付与し、body背景にトークン
  # (--background)を直接効かせてから撮る(両サイドへ同一の注入)
  dark_js = dark ? "document.documentElement.classList.add('dark');document.body.style.backgroundColor='var(--background)';" : ""
  page.execute_script(
    "const s=document.createElement('style');s.textContent='*{animation:none!important;transition:none!important}';document.head.append(s);" \
    "document.body.style.minHeight='#{min_height}px';document.body.style.padding='0';#{dark_js}"
  )
  # 戻り値は注入後の body の計算背景色(dark適用の確認に使う)
  bg = page.evaluate_script("getComputedStyle(document.body).backgroundColor")
  page.save_screenshot(body_path, selector: "body")
  bg
end

RSpec.describe "visual parity", :parity, type: :system do
  before do
    driven_by :shadcn_cuprite
    page.current_window.resize_to(1024, 768)
  end

  PARITY_SCENARIOS.each do |ours_path, demo_id, scenario_threshold|
    PARITY_MODES.each do |mode|
      dark = mode == :dark
      threshold =
        if dark && PARITY_DARK_THRESHOLDS.key?(demo_id)
          PARITY_DARK_THRESHOLDS.fetch(demo_id)
        else
          scenario_threshold || PARITY_THRESHOLD
        end
      it "#{ours_path} が upstream(#{demo_id}) と一致する(#{mode})" do
        min_height = demo_id == "select/default" ? 220 : 1
        dir = ParityArtifacts.scenario_dir(demo_id, mode)
        FileUtils.mkdir_p(dir)
        ours_png = File.join(dir, "ours.png")
        upstream_png = File.join(dir, "upstream.png")
        diff_png = File.join(dir, "diff.png")
        report_json = File.join(dir, "report.json")

        visit "http://127.0.0.1:4173/?demo=#{demo_id}"
        if demo_id == "select/default"
          find("[data-slot='select-trigger']").click
          find("[data-slot='select-content']")
        end
        upstream_bg = parity_capture(page, upstream_png, dark: dark, min_height: min_height)

        visit "/preview/#{ours_path}"
        if demo_id == "select/default"
          find("[data-slot='select-trigger']").click
          find("[data-slot='select-content']")
        end
        ours_bg = parity_capture(page, ours_png, dark: dark, min_height: min_height)

        if dark
          # .dark 注入の空振り(=ライト同士の比較になって誤って緑化)を防ぐ担保。
          # 片側だけ適用漏れがあればここで落ちる。未適用のbody背景は透過
          expect(upstream_bg).to eq(ours_bg)
          expect(upstream_bg).not_to eq("rgba(0, 0, 0, 0)"), "dark モードの .dark 注入が効いていません(body背景が透過のままです)"
        end

        out, status = Open3.capture2e("node", PARITY_COMPARE, ours_png, upstream_png, diff_png, report_json, threshold.to_s)
        report = JSON.parse(File.read(report_json))
        expect(report.fetch("pass")).to be(true), <<~MSG
          #{ours_path} のupstreamとの差分率が閾値(#{threshold})を超えました: #{report['ratio']}(#{mode})

          #{"#{out}\n" unless status.success?}
          artifacts: #{dir}
            ours.png / upstream.png / diff.png(赤=差分ピクセル)

          追跡baselineを更新する場合だけ `bundle exec rake parity:update` を実行してください。
        MSG
      end
    end
  end
end
