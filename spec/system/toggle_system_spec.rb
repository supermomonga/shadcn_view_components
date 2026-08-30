# frozen_string_literal: true

# Phase 2 のインタラクティブふるまい(層3 — 07-testing §5)。
# data-state / aria-pressed の遷移と、ネイティブ details の開閉を検証する
require "rails_helper"

RSpec.describe(
  "Toggle behavior",
  type: :system,
  component_coverage: {
    "toggle" => %i[pointer keyboard state],
    "toggle-group" => %i[pointer keyboard state],
    "accordion" => %i[pointer keyboard state]
  }
) do
  define_method(:press_key) do |key|
    page.driver.browser.page.keyboard.type(key)
  end

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

  it "opens and closes the native details accordion with valid ARIA references" do
    visit "/pages/toggles"

    details = find("#native-details details")
    expect(details["open"]).to be_falsey
    trigger = details.find("summary")
    content = details.find("[data-slot='accordion-content']", visible: :all)
    expect(trigger["aria-controls"]).to eq(content["id"])
    expect(content["aria-labelledby"]).to eq(trigger["id"])
    expect(content["role"]).to eq("region")

    # summary のネイティブ操作を保ちながら、controllerが状態と退出アニメーションを同期する
    trigger.click
    expect(details["open"]).to be_truthy
    expect(page).to have_text("折りたたみ内容")

    trigger.click
    expect(page).to have_no_selector("#native-details details[open]", visible: :all)
  end

  it "activates Toggle, ToggleGroup, and Accordion from the keyboard" do
    visit "/pages/toggles"

    page.execute_script("document.getElementById('toggle-bold').focus()")
    press_key(:enter)
    expect(page).to have_selector("#toggle-bold[data-state='on'][aria-pressed='true']:focus")

    page.execute_script("document.getElementById('item-b').focus()")
    press_key(:space)
    expect(page).to have_selector("#item-b[data-state='on'][aria-pressed='true']:focus")
    expect(page).to have_selector("#item-a[data-state='off'][aria-pressed='false']")

    page.execute_script("document.querySelector('#native-details summary').focus()")
    press_key(:enter)
    expect(page).to have_selector("#native-details details[open]")
  end
end
