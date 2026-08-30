# frozen_string_literal: true

# Phase 3 wave3d: メニュー族(ARIA menu)とリサイズハンドル
require "rails_helper"

RSpec.describe "Menu and Resizable behavior", type: :system do
  define_method(:press_key) do |key|
    page.driver.browser.page.keyboard.type(key)
  end

  define_method(:press_shift_tab) do
    page.driver.browser.page.keyboard.type(%i[shift tab])
  end

  it "opens the dropdown menu, highlights the first item, and closes on Esc" do
    visit "/pages/menus"

    find("#menu-trigger").click
    expect(page.evaluate_script("document.querySelector('#menu-content').matches(':popover-open')")).to be(true)
    # syncState は toggle タスクで走るため属性類は再試行付きで待つ
    expect(page).to have_selector("#menu-trigger[aria-expanded='true']")
    expect(page).to have_selector("#item-copy[data-highlighted='true']")
    expect(page.evaluate_script("document.activeElement.id")).to eq("item-copy")

    find("#menu-trigger").click
    expect(page).to have_selector("#menu-content[data-state='closed']", visible: :all)
    find("#menu-trigger").click
    expect(page).to have_selector("#menu-content[data-state='open']")

    find("#menu-content").send_keys(:escape)
    # popover の toggle イベントはマイクロタスクで発火するため再試行付きで検証する
    expect(page).to have_selector("#menu-content[data-state='closed']", visible: :all)
    expect(find("#menu-trigger")["aria-expanded"]).to eq("false")

    # Popover APIのtoggle通知より先に2回目の操作が完了しても、論理closeを維持する
    page.execute_script("const trigger = document.querySelector('#menu-trigger'); trigger.click(); trigger.click()")
    expect(page).to have_selector("#menu-content[data-state='closed']", visible: :all)
    expect(find("#menu-trigger")["aria-expanded"]).to eq("false")
    expect(page).to have_no_selector("#menu-content:popover-open", visible: :all)

    find("#menu-trigger").click
    press_key(:tab)
    expect(page).to have_selector("#menu-content[data-state='closed']", visible: :all)

    find("#menu-trigger").click
    press_shift_tab
    expect(page).to have_selector("#menu-content[data-state='closed']", visible: :all)
    expect(page).to have_no_selector("#menu-content:popover-open", visible: :all)
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
    page.execute_script("window.menuItemActivations = 0; document.querySelector('#item-copy').addEventListener('click', () => { window.menuItemActivations += 1 })")
    press_key(:enter)
    expect(page.evaluate_script("window.menuItemActivations")).to eq(1)
    expect(page).to have_selector("#menu-content[data-state='closed']", visible: :all)

    find("#menu-trigger").click
    press_key(:space)
    expect(page.evaluate_script("window.menuItemActivations")).to eq(2)
    expect(page).to have_selector("#menu-content[data-state='closed']", visible: :all)
  end

  it "closes another menu root when opening a menubar from the keyboard" do
    visit "/pages/menus"

    find("#menu-trigger").click
    page.execute_script("document.querySelector('#menubar-file').focus()")
    press_key(:enter)

    expect(page).to have_selector("#menu-content[data-state='closed']", visible: :all)
    expect(page).to have_selector("#menubar-file-content[data-state='open']")
    expect(find("#menu-trigger")["aria-expanded"]).to eq("false")
  end

  it "coordinates auto menus, Popover, and the manual ContextMenu" do
    visit "/pages/menus"

    find("#menu-trigger").click
    page.execute_script("document.querySelector('#peer-popover-trigger').focus()")
    press_key(:enter)
    expect(page).to have_selector("#menu-content[data-state='closed']", visible: :all)
    expect(page).to have_selector("#peer-popover-content[data-state='open']")

    page.execute_script("document.querySelector('#menu-trigger').focus()")
    press_key(:enter)
    expect(page).to have_selector("#peer-popover-content[data-state='closed']", visible: :all)
    expect(page).to have_selector("#menu-content[data-state='open']")

    page.execute_script("document.querySelector('#peer-popover-trigger').focus()")
    press_key(:enter)
    expect(page).to have_selector("#peer-popover-content[data-state='open']")
    page.execute_script(<<~JS)
      const trigger = document.querySelector("#context-area")
      trigger.focus()
      trigger.dispatchEvent(new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 24,
        clientY: 32,
      }))
    JS
    expect(page).to have_selector("#peer-popover-content[data-state='closed']", visible: :all)
    expect(page).to have_selector("#context-content[data-state='open']")

    page.execute_script("document.querySelector('#peer-popover-trigger').focus()")
    press_key(:enter)
    expect(page).to have_selector("#context-content[data-state='closed']", visible: :all)
    expect(page).to have_selector("#peer-popover-content[data-state='open']")
  end

  it "opens the context menu on right click at the pointer" do
    visit "/pages/menus"

    find("#context-area").right_click
    expect(page.evaluate_script("document.querySelector('#context-content').matches(':popover-open')")).to be(true)

    press_shift_tab
    expect(page).to have_selector("#context-content[data-state='closed']", visible: :all)
    expect(page).to have_no_selector("#context-content:popover-open", visible: :all)

    find("#context-area").right_click
    press_key(:escape)
    expect(page).to have_selector("#context-content[data-state='closed']", visible: :all)
    expect(page.evaluate_script("document.activeElement.id")).to eq("context-area")

    find("#context-area").right_click
    find("#context-area").click
    expect(page).to have_selector("#context-content[data-state='closed']", visible: :all)

    find("#context-area").right_click
    find("#ctx-open").click
    expect(page).to have_selector("#context-content[data-state='closed']", visible: :all)
  end

  it "opens paired menubar menus and switches them with horizontal keyboard navigation" do
    visit "/pages/menus"

    find("#menubar-file").click
    expect(page.evaluate_script("document.querySelector('#menubar-file-content').matches(':popover-open')")).to be(true)
    expect(page).to have_selector("#menubar-file[aria-expanded='true']")
    expect(find("#menubar-file")["aria-controls"]).to eq("menubar-file-content")
    expect(find("#menubar-file-content")["aria-labelledby"]).to eq("menubar-file")

    press_shift_tab
    expect(page).to have_selector("#menubar-file-content[data-state='closed']", visible: :all)
    expect(page).to have_no_selector("#menubar-file-content:popover-open", visible: :all)
    expect(page.evaluate_script("document.activeElement.id")).to eq("peer-popover-trigger")

    find("#menubar-file").click
    expect(page).to have_selector("#menubar-file-content[data-state='open']")
    press_key(:tab)
    expect(page).to have_selector("#menubar-file-content[data-state='closed']", visible: :all)
    expect(page.evaluate_script("document.activeElement.id")).to eq("nav-home")

    find("#menubar-file").click
    expect(page).to have_selector("#menubar-file-content[data-state='open']")
    find("#menubar-file").click
    expect(page).to have_selector("#menubar-file-content[data-state='closed']", visible: :all)
    find("#menubar-file").click
    expect(page).to have_selector("#menubar-file-content[data-state='open']")

    find("#menubar-edit").click
    expect(page).to have_selector("#menubar-file-content[data-state='closed']", visible: :all)
    expect(page).to have_selector("#menubar-edit-content[data-state='open']")
    expect(page).to have_selector("#menubar-edit[aria-expanded='true']")
    expect(page).to have_selector("#menubar-file[aria-expanded='false']")

    press_key(:left)
    expect(page).to have_selector("#menubar-edit-content[data-state='closed']", visible: :all)
    expect(page).to have_selector("#menubar-file-content[data-state='open']")
    expect(page.evaluate_script("document.activeElement.id")).to eq("menubar-new")

    press_key(:escape)
    expect(page).to have_selector("#menubar-file-content[data-state='closed']", visible: :all)
    expect(page.evaluate_script("document.activeElement.id")).to eq("menubar-file")
  end

  it "closes one menubar submenu level per Escape and restores the owning focus" do
    visit "/pages/menus"

    find("#menubar-file").click
    page.execute_script("document.querySelector('#menubar-recent').focus()")
    press_key(:right)
    expect(page).to have_selector("#menubar-recent-content[data-state='open']")
    expect(page.evaluate_script("document.activeElement.id")).to eq("menubar-project")

    press_shift_tab
    expect(page).to have_selector("#menubar-recent-content[data-state='closed']", visible: :all)
    expect(page).to have_selector("#menubar-file-content[data-state='closed']", visible: :all)
    expect(page).to have_no_selector("#menubar-recent-content:popover-open", visible: :all)
    expect(page).to have_no_selector("#menubar-file-content:popover-open", visible: :all)
    expect(page.evaluate_script("document.activeElement.id")).to eq("peer-popover-trigger")

    find("#menubar-file").click
    page.execute_script("document.querySelector('#menubar-recent').focus()")
    press_key(:right)
    press_key(:escape)
    expect(page).to have_selector("#menubar-recent-content[data-state='closed']", visible: :all)
    expect(page).to have_selector("#menubar-file-content[data-state='open']")
    expect(page.evaluate_script("document.activeElement.id")).to eq("menubar-recent")

    press_key(:escape)
    expect(page).to have_selector("#menubar-file-content[data-state='closed']", visible: :all)
    expect(page.evaluate_script("document.activeElement.id")).to eq("menubar-file")
  end

  it "opens paired navigation-menu content and keeps link keyboard behavior" do
    visit "/pages/menus"

    find("#nav-docs").click
    expect(page.evaluate_script("document.querySelector('#nav-docs-content').matches(':popover-open')")).to be(true)
    expect(find("#nav-docs")["aria-controls"]).to eq("nav-docs-content")
    expect(find("#nav-docs-content")["aria-labelledby"]).to be_nil

    find("#nav-docs").click
    expect(page).to have_selector("#nav-docs-content[data-state='closed']", visible: :all)
    find("#nav-docs").click
    expect(page).to have_selector("#nav-docs-content[data-state='open']")

    page.execute_script("document.querySelector('#nav-docs').focus()")
    press_key(:right)
    expect(page).to have_selector("#nav-docs-content[data-state='closed']", visible: :all)
    expect(page).to have_selector("#nav-guides-content[data-state='open']")
    expect(page.evaluate_script("document.activeElement.id")).to eq("nav-guides")

    find("h1").click
    expect(page).to have_selector("#nav-guides-content[data-state='closed']", visible: :all)

    find("#nav-guides").click
    page.execute_script("document.querySelector('#nav-guides').focus()")
    press_key(:down)
    expect(page.evaluate_script("document.activeElement.id")).to eq("nav-rails")
    page.execute_script("window.navigationLinkActivated = false; document.querySelector('#nav-rails').addEventListener('click', () => { window.navigationLinkActivated = true }, { once: true })")
    press_key(:enter)
    expect(page.evaluate_script("window.navigationLinkActivated")).to be(true)
    expect(page).to have_selector("#nav-guides-content[data-state='closed']", visible: :all)
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
