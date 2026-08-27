# frozen_string_literal: true

# Phase 3 wave3d: メニュー族(ARIA menu)とリサイズハンドル
require "rails_helper"

RSpec.describe "Menu and Resizable behavior", type: :system do
  it "opens the dropdown menu, highlights the first item, and closes on Esc" do
    visit "/pages/menus"

    find("#menu-trigger").click
    expect(page.evaluate_script("document.querySelector('#menu-content').matches(':popover-open')")).to be(true)
    expect(find("#menu-trigger")["aria-expanded"]).to eq("true")
    expect(find("#item-copy")["data-highlighted"]).to eq("true")
    expect(page.evaluate_script("document.activeElement.id")).to eq("item-copy")

    find("#menu-content").send_keys(:escape)
    # popover の toggle イベントはマイクロタスクで発火するため再試行付きで検証する
    expect(page).to have_selector("#menu-content[data-state='closed']", visible: :all)
    expect(find("#menu-trigger")["aria-expanded"]).to eq("false")
  end

  it "moves highlight with arrow keys (APG roving)" do
    visit "/pages/menus"

    find("#menu-trigger").click
    # send_keys はクリックを伴うためメニューが閉じてしまう。keydown を合成して検証する
    press = lambda do |key|
      page.execute_script(<<~JS)
        document.querySelector("#menu-content").dispatchEvent(
          new KeyboardEvent("keydown", { key: "#{key}", bubbles: true })
        )
      JS
    end
    press.call("ArrowDown")
    expect(find("#item-paste")["data-highlighted"]).to eq("true")
    expect(page.evaluate_script("document.activeElement.id")).to eq("item-paste")

    press.call("ArrowUp")
    expect(find("#item-copy")["data-highlighted"]).to eq("true")
  end

  it "activates a menu item and closes the menu" do
    visit "/pages/menus"

    find("#menu-trigger").click
    find("#item-paste").click
    expect(page).to have_selector("#menu-content[data-state='closed']", visible: :all)
  end

  it "opens the context menu on right click at the pointer" do
    visit "/pages/menus"

    find("#context-area").right_click
    expect(page.evaluate_script("document.querySelector('#context-content').matches(':popover-open')")).to be(true)

    find("#ctx-open").click
    expect(page).to have_selector("#context-content[data-state='closed']", visible: :all)
  end

  it "opens a menubar menu from its trigger" do
    visit "/pages/menus"

    find("#menubar-file").click
    expect(page.evaluate_script("document.querySelector('#menubar-file-content').matches(':popover-open')")).to be(true)
    expect(find("#menubar-file")["aria-expanded"]).to eq("true")

    find("#menubar-new").click
    expect(page).to have_selector("#menubar-file-content[data-state='closed']", visible: :all)
  end

  it "opens a navigation-menu content from its trigger" do
    visit "/pages/menus"

    find("#nav-docs").click
    expect(page.evaluate_script("document.querySelector('#nav-docs-content').matches(':popover-open')")).to be(true)
    expect(page).to have_link("はじめに", href: "#intro")
  end

  it "resizes panels by keyboard nudge on the handle" do
    visit "/pages/menus"

    basis = "parseFloat(getComputedStyle(document.querySelector('#panel-left')).flexBasis)"
    before = page.evaluate_script(basis)
    find("#resize-handle").send_keys(:right)
    after = page.evaluate_script(basis)

    expect(after).to be > (before.zero? ? 0 : before)
  end
end
