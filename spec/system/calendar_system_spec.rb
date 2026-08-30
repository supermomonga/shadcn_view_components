# frozen_string_literal: true

# Phase 4 個別評価: calendar(react-day-picker 非依存の月テーブル)
require "rails_helper"

RSpec.describe(
  "Calendar behavior",
  type: :system,
  component_coverage: { "calendar" => %i[pointer keyboard state] }
) do
  include ActiveSupport::Testing::TimeHelpers

  around do |example|
    travel_to(Time.zone.local(2026, 8, 30, 12)) { example.run }
  end

  define_method(:press_key) do |key|
    page.driver.browser.page.keyboard.type(key)
  end

  it "renders the month grid with weekday headers and day buttons" do
    # 月を明示しないと「今日」に依存して将来赤化する(時限爆弾)ため固定月を使う
    visit "/pages/calendar?month=2026-08"

    calendar = find("#demo-calendar")
    expect(calendar["data-slot"]).to eq("calendar")

    expect(all("#demo-calendar thead th").map(&:text)).to eq(%w[日 月 火 水 木 金 土])
    expect(page).to have_selector("#demo-calendar [data-slot='calendar-day-button']", count: 42)
    expect(page).to have_selector("#demo-calendar [data-day='2026-08-26'][data-selected-single='true']")
    expect(page).to have_selector(
      "#demo-calendar [role='gridcell'][aria-selected='true'] [data-day='2026-08-26'][aria-label='2026年8月26日']"
    )
    expect(page).to have_selector(
      "#demo-calendar [data-day='2026-08-30'][aria-current='date'][aria-label='2026年8月30日']"
    )
    expect(find("#demo-calendar [data-slot='calendar-grid']")["aria-labelledby"])
      .to eq(find("#demo-calendar [data-slot='calendar-caption']")["id"])
    expect(page).to have_selector("#demo-calendar [data-slot='calendar-day-button'][tabindex='0']", count: 1)
  end

  it "navigates to the previous and next month via server round-trip links" do
    visit "/pages/calendar?month=2026-08"

    expect(page).to have_text("2026年8月")
    find("#demo-calendar [aria-label='前の月']").click
    expect(page).to have_text("2026年7月")

    find("#demo-calendar [aria-label='次の月']").click
    expect(page).to have_text("2026年8月")
  end

  it "marks outside days as muted and non-focusable" do
    visit "/pages/calendar?month=2026-08"

    # 8月1日(土)より前の補完日 = 7月末尾
    expect(page).to have_selector("#demo-calendar [data-day='2026-07-26'][data-outside='true']")
    expect(find("#demo-calendar [data-day='2026-07-26'][tabindex='-1']", visible: :all)).to be_present
  end

  it "moves one roving focus target by day, week, and week boundary keys" do
    visit "/pages/calendar?month=2026-08"

    page.execute_script("document.querySelector(\"#demo-calendar [data-day='2026-08-26']\").focus()")
    press_key(:right)
    expect(page).to have_selector("#demo-calendar [data-day='2026-08-27']:focus[tabindex='0']")

    press_key(:down)
    expect(page).to have_selector("#demo-calendar [data-day='2026-09-03']:focus[tabindex='0']")

    press_key(:home)
    expect(page).to have_selector("#demo-calendar [data-day='2026-08-30']:focus[tabindex='0']")

    press_key(:end)
    expect(page).to have_selector("#demo-calendar [data-day='2026-09-05']:focus[tabindex='0']")
    expect(page).to have_selector("#demo-calendar [data-slot='calendar-day-button'][tabindex='0']", count: 1)
  end
end
