# frozen_string_literal: true

# Phase 3 wave3c: Popover API / hover intent / tooltip 遅延制御
require "rails_helper"

RSpec.describe "Popover-family behavior", type: :system do
  it "toggles the popover and syncs state via the native toggle event" do
    visit "/pages/popovers"

    # popover=auto の閉状態はUAスタイル(display:none)による。data-state で検証する
    expect(find("#popover-content", visible: :all)["data-state"]).to eq("closed")

    find("#popover-trigger").click
    expect(find("#popover-content")["data-state"]).to eq("open")
    expect(find("#popover-trigger")["aria-expanded"]).to eq("true")
    expect(find("#popover-content")).to be_visible
  end

  it "light-dismisses the popover when clicking outside (popover=auto)" do
    visit "/pages/popovers"

    find("#popover-trigger").click
    expect(find("#popover-content")["data-state"]).to eq("open")

    # 本物のマウスクリックで light dismiss を起こす(合成クリックは対象外)
    find("h1").click
    expect(find("#popover-content", visible: :all)["data-state"]).to eq("closed")
    expect(find("#popover-trigger")["aria-expanded"]).to eq("false")
  end

  it "shows the hover-card on trigger hover with intent delay" do
    visit "/pages/popovers"

    find("#hover-trigger").hover
    expect(page).to have_selector("#hover-card-content", text: "Ruby on Rails のカード")
    expect(find("#hover-card-content")["data-state"]).to eq("open")
  end

  it "shows the tooltip on focus and links it via aria-describedby" do
    visit "/pages/popovers"

    find("#tooltip-trigger").click
    expect(page).to have_selector("#tooltip-content", text: "ツールチップの内容")
    expect(find("#tooltip-trigger")["aria-describedby"]).to eq("tooltip-content")
    expect(find("#tooltip-content")["data-state"]).to eq("open")

    find("h1").click
    expect(find("#tooltip-content", visible: :all)[:hidden]).to be_present
  end
end
