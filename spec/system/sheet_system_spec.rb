# frozen_string_literal: true

# Phase 3: sheet / drawer(ネイティブ <dialog> のスライド変形)
require "rails_helper"

RSpec.describe(
  "Sheet and Drawer behavior",
  type: :system,
  component_coverage: {
    "sheet" => %i[pointer keyboard state accessibility],
    "drawer" => %i[pointer keyboard state accessibility]
  }
) do
  it "opens the sheet from its trigger and closes via Escape" do
    visit "/pages/sheets"

    find("#open-sheet").click
    expect(page.evaluate_script("document.querySelector('#demo-sheet').open")).to be(true)
    expect(find("#open-sheet")["aria-expanded"]).to eq("true")
    expect(find("#open-sheet")["aria-controls"]).to eq("demo-sheet")
    expect(find("#demo-sheet", visible: :all)["aria-labelledby"])
      .to eq(find("[data-slot='sheet-title']", visible: :all)["id"])
    expect(find("#demo-sheet", visible: :all)["aria-describedby"])
      .to eq(find("[data-slot='sheet-description']", visible: :all)["id"])

    find("#demo-sheet").send_keys(:escape)
    expect(page.evaluate_script("document.querySelector('#demo-sheet').open")).to be(false)
    # close イベントはタスク発火のため aria-expanded の反映を再試行付きで待つ
    expect(page).to have_selector("#open-sheet[aria-expanded='false']")
  end

  it "opens the drawer from its trigger and closes via its close button or Escape" do
    visit "/pages/sheets"

    find("#open-drawer").click
    expect(page.evaluate_script("document.querySelector('#demo-drawer').open")).to be(true)
    expect(find("#demo-drawer", visible: :all)["data-vaul-drawer-direction"]).to eq("bottom")
    expect(find("#open-drawer")["aria-controls"]).to eq("demo-drawer")
    expect(find("#demo-drawer", visible: :all)["aria-labelledby"])
      .to eq(find("[data-slot='drawer-title']", visible: :all)["id"])

    find("#close-drawer").click
    # close は exitアニメーション(フォールバック300ms)を待ってから発火するため再試行付きで待つ
    expect(page).to have_no_selector("#demo-drawer[open]")

    find("#open-drawer").click
    expect(page).to have_selector("#demo-drawer[open]")
    find("#demo-drawer").send_keys(:escape)
    expect(page).to have_no_selector("#demo-drawer[open]", visible: :all)
    expect(page).to have_selector("#open-drawer[aria-expanded='false']")
  end
end
