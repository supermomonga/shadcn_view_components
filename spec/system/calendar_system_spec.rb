# frozen_string_literal: true

# Phase 4 個別評価: calendar(react-day-picker 非依存の月テーブル)
require "rails_helper"

RSpec.describe "Calendar behavior", type: :system do
  it "renders the month grid with weekday headers and day buttons" do
    # 月を明示しないと「今日」に依存して将来赤化する(時限爆弾)ため固定月を使う
    visit "/pages/calendar?month=2026-08"

    calendar = find("#demo-calendar")
    expect(calendar["data-slot"]).to eq("calendar")

    expect(all("#demo-calendar thead th").map(&:text)).to eq(%w[日 月 火 水 木 金 土])
    expect(page).to have_selector("#demo-calendar [data-slot='calendar-day-button']", count: 42)
    expect(page).to have_selector("#demo-calendar [data-day='2026-08-26'][data-selected-single='true']")
  end

  it "navigates to the previous and next month via server round-trip links" do
    visit "/pages/calendar?month=2026-08"

    expect(page).to have_text("2026年 8月")
    find("#demo-calendar [aria-label='前の月']").click
    expect(page).to have_text("2026年 7月")

    find("#demo-calendar [aria-label='次の月']").click
    expect(page).to have_text("2026年 8月")
  end

  it "marks outside days as muted and non-focusable" do
    visit "/pages/calendar?month=2026-08"

    # 8月1日(土)より前の補完日 = 7月末尾
    expect(page).to have_selector("#demo-calendar [data-day='2026-07-26'][data-outside='true']")
    expect(find("#demo-calendar [data-day='2026-07-26'][tabindex='-1']", visible: :all)).to be_present
  end
end
