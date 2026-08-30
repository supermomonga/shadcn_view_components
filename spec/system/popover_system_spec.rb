# frozen_string_literal: true

# Phase 3 wave3c: Popover API / hover intent / tooltip 遅延制御
require "rails_helper"

RSpec.describe(
  "Popover-family behavior",
  type: :system,
  component_coverage: {
    "popover" => %i[pointer keyboard state],
    "hover-card" => %i[pointer keyboard state],
    "tooltip" => %i[pointer keyboard state]
  }
) do
  define_method(:press_key) do |key|
    page.driver.browser.page.keyboard.type(key)
  end

  it "toggles the popover and syncs state via the native toggle event" do
    visit "/pages/popovers"

    # popover=auto の閉状態はUAスタイル(display:none)による。data-state で検証する
    expect(find("#popover-content", visible: :all)["data-state"]).to eq("closed")

    find("#popover-trigger").click
    # toggle イベントはタスク発火のため、属性反映を再試行付きで待つ
    expect(page).to have_selector("#popover-content[data-state='open']")
    expect(page).to have_selector("#popover-trigger[aria-expanded='true']")
    expect(find("#popover-content")).to be_visible
  end

  it "light-dismisses the popover when clicking outside (popover=auto)" do
    visit "/pages/popovers"

    find("#popover-trigger").click
    expect(page).to have_selector("#popover-content[data-state='open']")

    # 本物のマウスクリックで light dismiss を起こす(合成クリックは対象外)
    find("h1").click
    expect(page).to have_selector("#popover-content[data-state='closed']", visible: :all)
    expect(page).to have_selector("#popover-trigger[aria-expanded='false']")
  end

  it "opens the popover with Enter or Space and closes it with Escape" do
    visit "/pages/popovers"

    page.execute_script("document.getElementById('popover-trigger').focus()")
    press_key(:enter)
    expect(page).to have_selector("#popover-content[data-state='open']")
    expect(page).to have_selector("#popover-trigger[aria-expanded='true']:focus")

    press_key(:escape)
    expect(page).to have_selector("#popover-content[data-state='closed']", visible: :all)
    expect(page).to have_selector("#popover-trigger[aria-expanded='false']:focus")

    press_key(:space)
    expect(page).to have_selector("#popover-content[data-state='open']")
    press_key(:escape)
    expect(page).to have_selector("#popover-content[data-state='closed']", visible: :all)
  end

  it "shows the hover-card on trigger hover with intent delay" do
    visit "/pages/popovers"

    find("#hover-trigger").hover
    expect(page).to have_selector("#hover-card-content", text: "Ruby on Rails のカード")
    expect(find("#hover-card-content")["data-state"]).to eq("open")
  end

  it "shows the hover-card when keyboard focus moves to its trigger" do
    visit "/pages/popovers"

    page.execute_script("document.getElementById('popover-trigger').focus()")
    press_key(:tab)
    expect(page.evaluate_script("document.activeElement.id")).to eq("hover-trigger")
    expect(page).to have_selector("#hover-card-content[data-state='open']")

    press_key(:tab)
    expect(page).to have_selector("#hover-card-content[hidden]", visible: :all)
  end

  it "shows the tooltip on focus and links it via aria-describedby" do
    visit "/pages/popovers"

    page.execute_script("document.getElementById('hover-trigger').focus()")
    press_key(:tab)
    expect(page.evaluate_script("document.activeElement.id")).to eq("tooltip-trigger")
    expect(page).to have_selector("#tooltip-content", text: "ツールチップの内容")
    expect(find("#tooltip-trigger")["aria-describedby"]).to eq("tooltip-content")
    expect(page).to have_selector("#tooltip-content[data-state='open']")

    press_key(:tab)
    expect(page).to have_selector("#tooltip-content[hidden]", visible: :all)
  end

  it "shows and hides the tooltip through pointer hover" do
    visit "/pages/popovers"

    find("#tooltip-trigger").hover
    expect(page).to have_selector("#tooltip-content[data-state='open']", text: "ツールチップの内容")

    find("h1").hover
    expect(page).to have_selector("#tooltip-content[hidden]", visible: :all)
  end
end
