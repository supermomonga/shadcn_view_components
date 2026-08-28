# frozen_string_literal: true

# Phase 2 wave2: カルーセルのナビ補助(ボタン有効化とスクロール)
require "rails_helper"

RSpec.describe "Carousel behavior", type: :system do
  it "disables previous until scrolled and scrolls by page on next" do
    visit "/pages/carousel"

    expect(find("#carousel-prev")).to be_disabled
    expect(find("#carousel-next")).not_to be_disabled

    find("#carousel-next").click
    # smooth スクロールは非同期。ボタンの有効化(=スクロール位置の反映)を
    # 再試行付きで待ってから位置を検証する(be_disabled は待機しないため使わない)
    expect(page).to have_no_selector("#carousel-prev[disabled]")
    expect(page.evaluate_script("document.querySelector('[data-slot=carousel-content]').scrollLeft")).to be > 0
  end

  it "moves focus-free: scroll state reflects on buttons after manual scroll" do
    visit "/pages/carousel"

    page.execute_script(<<~JS)
      const viewport = document.querySelector("[data-slot='carousel-content']")
      viewport.scrollLeft = viewport.scrollWidth
      viewport.dispatchEvent(new Event("scroll"))
    JS
    expect(find("#carousel-next")).to be_disabled
    expect(find("#carousel-prev")).not_to be_disabled
  end
end
