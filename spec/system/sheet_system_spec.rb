# frozen_string_literal: true

# Phase 3: sheet / drawer(ネイティブ <dialog> のスライド変形)
require "rails_helper"

RSpec.describe "Sheet and Drawer behavior", type: :system do
  it "opens the sheet from its trigger and closes via Escape" do
    visit "/pages/sheets"

    find("#open-sheet").click
    expect(page.evaluate_script("document.querySelector('#demo-sheet').open")).to be(true)
    expect(find("#open-sheet")["aria-expanded"]).to eq("true")

    find("#demo-sheet").send_keys(:escape)
    expect(page.evaluate_script("document.querySelector('#demo-sheet').open")).to be(false)
    # close イベントはタスク発火のため aria-expanded の反映を再試行付きで待つ
    expect(page).to have_selector("#open-sheet[aria-expanded='false']")
  end

  it "opens the drawer from its trigger and closes via its close button" do
    visit "/pages/sheets"

    find("#open-drawer").click
    expect(page.evaluate_script("document.querySelector('#demo-drawer').open")).to be(true)
    expect(find("#demo-drawer", visible: :all)["data-vaul-drawer-direction"]).to eq("bottom")

    find("#close-drawer").click
    # close は exitアニメーション(フォールバック300ms)を待ってから発火するため再試行付きで待つ
    expect(page).to have_no_selector("#demo-drawer[open]")
  end
end
