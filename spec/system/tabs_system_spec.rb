# frozen_string_literal: true

# Phase 2 wave2 のインタラクティブふるまい(層3 — 07-testing §5)。
# ARIA tabs パターン: クリック選択・パネル切替・roving tabindex(05 §4)
require "rails_helper"

RSpec.describe "Tabs behavior", type: :system do
  it "activates the first trigger and shows its panel on connect" do
    visit "/pages/tabs"

    account = find("#trigger-account")
    expect(account["data-active"]).to eq("")
    expect(account["aria-selected"]).to eq("true")
    expect(account["tabindex"]).to eq("0")
    expect(find("#trigger-password")["tabindex"]).to eq("-1")
    expect(account["aria-controls"]).to eq("panel-account")
    expect(find("#panel-account")["aria-labelledby"]).to eq("trigger-account")
    expect(find("#panel-account")["tabindex"]).to eq("0")

    expect(find("#panel-account")).to be_visible
    expect(page).to have_selector("#panel-password[hidden]", visible: :all)
  end

  it "switches panels on click" do
    visit "/pages/tabs"

    find("#trigger-password").click
    expect(find("#trigger-password")["aria-selected"]).to eq("true")
    expect(find("#trigger-account")["aria-selected"]).to eq("false")
    expect(find("#panel-password")).to be_visible
    expect(page).to have_selector("#panel-account[hidden]", visible: :all)
  end

  it "moves focus and selection with arrow keys (roving tabindex)" do
    visit "/pages/tabs"

    find("#trigger-account").click
    find("#trigger-account").send_keys(:right)
    expect(find("#trigger-password")["data-active"]).to eq("")
    expect(page.evaluate_script("document.activeElement.id")).to eq("trigger-password")

    find("#trigger-password").send_keys(:left)
    expect(find("#trigger-account")["data-active"]).to eq("")
    expect(page.evaluate_script("document.activeElement.id")).to eq("trigger-account")
  end

  it "moves to the first and last trigger with Home and End" do
    visit "/pages/tabs"

    find("#trigger-account").click
    find("#trigger-account").send_keys(:end)
    expect(page.evaluate_script("document.activeElement.id")).to eq("trigger-password")
    expect(find("#trigger-password")["aria-selected"]).to eq("true")

    find("#trigger-password").send_keys(:home)
    expect(page.evaluate_script("document.activeElement.id")).to eq("trigger-account")
    expect(find("#trigger-account")["aria-selected"]).to eq("true")
  end
end
