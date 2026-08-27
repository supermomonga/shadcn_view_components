# frozen_string_literal: true

# Phase 2 のインタラクティブふるまい(層3 — 07-testing §5)。
# data-state / aria-pressed の遷移と、ネイティブ details のJS無し開閉を検証する
require "rails_helper"

RSpec.describe "Toggle behavior", type: :system do
  it "toggles data-state and aria-pressed on click" do
    visit "/pages/toggles"

    toggle = find("#toggle-bold")
    expect(toggle["data-state"]).to eq("off")
    expect(toggle["aria-pressed"]).to eq("false")

    toggle.click
    expect(toggle["data-state"]).to eq("on")
    expect(toggle["aria-pressed"]).to eq("true")

    toggle.click
    expect(toggle["data-state"]).to eq("off")
  end

  it "enforces exclusivity in a single toggle-group" do
    visit "/pages/toggles"

    item_a = find("#item-a")
    item_b = find("#item-b")
    expect(item_a["data-state"]).to eq("on")

    item_b.click
    expect(item_b["data-state"]).to eq("on")
    expect(item_a["data-state"]).to eq("off")
    expect(item_a["aria-pressed"]).to eq("false")
  end

  it "opens and closes the native details accordion without custom JS" do
    visit "/pages/toggles"

    details = find("#native-details details")
    expect(details["open"]).to be_falsey

    # summary が details の直接子である限り、ブラウザの標準挙動で開閉する
    details.find("summary").click
    expect(details["open"]).to be_truthy
    expect(page).to have_text("折りたたみ内容")

    details.find("summary").click
    expect(details["open"]).to be_falsey
  end
end
