# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Select behavior", type: :system do
  define_method(:dispatch_key) do |selector, key|
    page.execute_script(<<~JS)
      document.querySelector(#{selector.to_json}).dispatchEvent(
        new KeyboardEvent("keydown", { key: #{key.to_json}, bubbles: true, cancelable: true })
      )
    JS
  end

  # CupriteのNode#send_keysは対象をクリックしてからキーを送るため、Selectのように
  # click自体が状態を変える要素では使わない。既にあるフォーカスへCDPから実キーを送る。
  define_method(:press_key) do |key|
    page.driver.browser.page.keyboard.type(key)
  end

  it "derives the initial display, selected option, and ARIA relationships from the hidden value" do
    visit "/pages/select"

    expect(page).to have_selector("#fruit-select input[data-slot='select-input'][name='q'][value='banana']", visible: :all)
    expect(page).to have_selector("#option-banana[aria-selected='true'][data-selected='true']", visible: :all)
    expect(page).to have_selector("#option-apple[aria-selected='false']", visible: :all)
    expect(find("#fruit-trigger")).to have_text("バナナ")
    expect(find("#fruit-trigger")["aria-controls"]).to eq("fruit-select-listbox")
    expect(find("#fruit-select-listbox", visible: :all)["aria-labelledby"]).to eq("fruit-trigger")
  end

  it "selects by click and submits the committed value" do
    visit "/pages/select"

    find("#fruit-trigger").click
    expect(page.evaluate_script("document.querySelector('#fruit-content').matches(':popover-open')")).to be(true)
    find("#option-apple").click

    expect(page).to have_selector("#fruit-content[data-state='closed']", visible: :all)
    expect(find("#fruit-select input[data-slot='select-input']", visible: :all).value).to eq("apple")
    expect(find("#fruit-trigger")).to have_text("りんご")
    expect(page).to have_selector("#option-apple[aria-selected='true']", visible: :all)
    expect(page).to have_selector("#fruit-content[data-state='closed'][inert]", visible: :all)

    find("#select-submit").click
    expect(page).to have_selector("#echo-result", text: "apple")
  end

  it "moves across enabled options with ArrowUp/Down and Home/End, then commits with Enter" do
    visit "/pages/select"

    dispatch_key("#fruit-trigger", "ArrowDown")
    expect(page.evaluate_script("document.querySelector('#fruit-content').matches(':popover-open')")).to be(true)

    dispatch_key("#fruit-select", "Home")
    expect(find("#fruit-trigger")["aria-activedescendant"]).to eq("option-apple")

    dispatch_key("#fruit-select", "ArrowDown")
    expect(find("#fruit-trigger")["aria-activedescendant"]).to eq("option-banana")

    dispatch_key("#fruit-select", "ArrowDown")
    expect(find("#fruit-trigger")["aria-activedescendant"]).to eq("option-orange")
    expect(page.evaluate_script("document.activeElement.id")).to eq("option-orange")

    dispatch_key("#fruit-select", "ArrowUp")
    expect(find("#fruit-trigger")["aria-activedescendant"]).to eq("option-banana")

    dispatch_key("#fruit-select", "End")
    expect(find("#fruit-trigger")["aria-activedescendant"]).to eq("option-orange")

    dispatch_key("#fruit-select", "Home")
    expect(find("#fruit-trigger")["aria-activedescendant"]).to eq("option-apple")

    press_key(:enter)
    expect(find("#fruit-select input[data-slot='select-input']", visible: :all).value).to eq("apple")
    expect(page).to have_selector("#fruit-content[data-state='closed']", visible: :all)
  end

  it "handles trusted Space and Escape key input without a duplicate button click" do
    visit "/pages/select"

    page.execute_script("document.querySelector('#fruit-trigger').focus()")
    press_key(:space)
    expect(page.evaluate_script("document.querySelector('#fruit-content').matches(':popover-open')")).to be(true)
    expect(find("#fruit-trigger")["aria-activedescendant"]).to eq("option-banana")

    press_key(:escape)
    expect(page).to have_selector("#fruit-content[data-state='closed']", visible: :all)
    expect(page.evaluate_script("document.activeElement.id")).to eq("fruit-trigger")
    expect(page).to have_selector("#fruit-content[data-state='closed'][inert]", visible: :all)

    press_key(:space)
    press_key(:end)
    press_key(:space)
    expect(find("#fruit-select input[data-slot='select-input']", visible: :all).value).to eq("orange")
    expect(find("#fruit-trigger")).to have_text("オレンジ")
  end

  it "keeps the active option visible in an overflowing list and exposes only usable scroll arrows" do
    visit "/pages/select"

    find("#fruit-trigger").click
    expect(page).to have_selector("#fruit-content [data-slot='select-scroll-up-button'][hidden]", visible: :all)
    expect(page).to have_selector("#fruit-content [data-slot='select-scroll-down-button']:not([hidden])")

    press_key(:end)
    expect(page).to have_selector("#option-orange:focus")
    expect(page.evaluate_script("document.querySelector('#fruit-select-listbox').scrollTop")).to be_positive
    expect(page).to have_selector("#fruit-content [data-slot='select-scroll-up-button']:not([hidden])")
    expect(page).to have_selector("#fruit-content [data-slot='select-scroll-down-button'][hidden]", visible: :all)

    arrow_inside_popup = page.evaluate_script(<<~JS)
      (() => {
        const popup = document.querySelector("#fruit-content").getBoundingClientRect()
        const arrow = document.querySelector("[data-slot='select-scroll-up-button']").getBoundingClientRect()
        return arrow.top >= popup.top && arrow.bottom <= popup.bottom
      })()
    JS
    expect(arrow_inside_popup).to be(true)

    before = page.evaluate_script("document.querySelector('#fruit-select-listbox').scrollTop")
    find("#fruit-content [data-slot='select-scroll-up-button']").hover
    expect(page).to satisfy do
      page.evaluate_script("document.querySelector('#fruit-select-listbox').scrollTop") < before
    end
  end

  it "closes without stealing focus when Tab leaves the listbox" do
    visit "/pages/select"

    find("#fruit-trigger").click
    page.execute_script("document.querySelector('#option-banana').focus()")
    expect(page).to have_selector("#option-banana:focus")
    press_key(:tab)

    expect(page).to have_selector("#fruit-content[data-state='closed']", visible: :all)
    expect(find("#fruit-trigger")["aria-expanded"]).to eq("false")
    expect(page.evaluate_script("document.activeElement.id")).to eq("select-submit")
  end

  it "does not select a disabled option and does not open a disabled select" do
    visit "/pages/select"

    find("#fruit-trigger").click
    page.execute_script("document.querySelector('#option-pear').click()")
    expect(find("#fruit-select input[data-slot='select-input']", visible: :all).value).to eq("banana")
    expect(page.evaluate_script("document.querySelector('#fruit-content').matches(':popover-open')")).to be(true)

    disabled_input = find("#disabled-select input[data-slot='select-input']", visible: :all)
    expect(disabled_input).to be_disabled
    expect(find("#disabled-select-trigger", visible: :all)).to be_disabled
    page.execute_script("document.querySelector('#disabled-select-trigger').click()")
    expect(page.evaluate_script("document.querySelector('#disabled-select-content').matches(':popover-open')")).to be(false)
  end

  it "restores the committed value and reconnects through an actual Turbo Drive cache visit" do
    visit "/pages/select"

    expect(page.evaluate_script("Boolean(window.Turbo?.session?.started)")).to be(true)
    page.execute_script(<<~JS)
      window.__selectTurboVisits = 0
      document.addEventListener("turbo:before-visit", () => window.__selectTurboVisits += 1)
    JS

    find("#fruit-trigger").click
    find("#option-orange").click
    expect(find("#fruit-select input[data-slot='select-input']", visible: :all).value).to eq("orange")
    expect(page).to have_no_selector("#fruit-content:popover-open", visible: :all)

    find("#select-away").click
    expect(page).to have_current_path("/pages/button")
    expect(page.evaluate_script("window.__selectTurboVisits")).to eq(1)

    page.go_back
    expect(page).to have_current_path("/pages/select")
    expect(find("#fruit-select input[data-slot='select-input']", visible: :all).value).to eq("orange")
    expect(find("#fruit-trigger")).to have_text("オレンジ")
    expect(page).to have_selector("#option-orange[aria-selected='true']", visible: :all)

    find("#fruit-trigger").click
    find("#option-apple").click
    expect(find("#fruit-select input[data-slot='select-input']", visible: :all).value).to eq("apple")
  end
end
