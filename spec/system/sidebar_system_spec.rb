# frozen_string_literal: true

# Phase 4: sidebar の開閉と、Turboキャッシュ復帰相当の再接続での冪等性(05 §6.2)
require "rails_helper"

RSpec.describe(
  "Sidebar behavior",
  type: :system,
  component_coverage: { "sidebar" => %i[pointer keyboard state reconnect] }
) do
  define_method(:press_key) do |key|
    page.driver.browser.page.keyboard.type(key)
  end

  it "toggles data-state and aria-expanded via the trigger" do
    visit "/pages/sidebar"

    expect(page).to have_selector("#sidebar-provider[data-state='open']")
    expect(page).to have_selector("#demo-sidebar[data-state='open']")

    find("#sidebar-trigger").click
    expect(page).to have_selector("#sidebar-provider[data-state='closed']")
    expect(page).to have_selector("#demo-sidebar[data-state='closed']")
    expect(page).to have_selector("#sidebar-trigger[aria-expanded='false']")

    find("#sidebar-trigger").click
    expect(page).to have_selector("#sidebar-provider[data-state='open']")
  end

  it "survives a cache-restored DOM reconnection (Turbo cache 相当)" do
    visit "/pages/sidebar"

    find("#sidebar-trigger").click
    expect(find("#sidebar-provider")["data-state"]).to eq("closed")

    # Turboキャッシュから復帰した状況を再現: ノードを複製して差し替える。
    # data-state はDOMごと保持され、再接続後も操作が壊れないことを検証する
    page.execute_script(<<~JS)
      const original = document.querySelector("#sidebar-provider")
      const restored = original.cloneNode(true)
      original.replaceWith(restored)
    JS
    expect(page).to have_selector("#sidebar-provider[data-state='closed']")

    # 再接続(Stimulus の MutationObserver)は非同期のため、切替結果は再試行付きで検証する
    find("#sidebar-trigger").click
    expect(page).to have_selector("#sidebar-provider[data-state='open']")
    expect(page).to have_selector("#sidebar-trigger[aria-expanded='true']")
  end

  it "toggles from the focused trigger with Enter" do
    visit "/pages/sidebar"

    page.execute_script("document.getElementById('sidebar-trigger').focus()")
    press_key(:enter)
    expect(page).to have_selector("#sidebar-provider[data-state='closed']")
    expect(page).to have_selector("#sidebar-trigger[aria-expanded='false']:focus")

    press_key(:enter)
    expect(page).to have_selector("#sidebar-provider[data-state='open']")
    expect(page).to have_selector("#sidebar-trigger[aria-expanded='true']:focus")
  end
end
