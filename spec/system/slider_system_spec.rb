# frozen_string_literal: true

require "rails_helper"

RSpec.describe(
  "Slider behavior",
  type: :system,
  component_coverage: { "slider" => %i[pointer keyboard state form accessibility] }
) do
  define_method(:press_key) do |key|
    page.driver.browser.page.keyboard.type(key)
  end

  it "forwards form and accessibility attributes to the range input and links its label" do
    visit "/pages/slider"

    input = find("#volume", visible: :all)
    root = input.ancestor("[data-slot='slider']")

    expect(input[:type]).to eq("range")
    expect(input[:name]).to eq("q")
    expect(input[:form]).to eq("slider-form")
    expect(input[:min]).to eq("10")
    expect(input[:max]).to eq("90")
    expect(input[:step]).to eq("5")
    expect(input.value).to eq("40")
    expect(input["aria-label"]).to eq("音量")
    expect(input["data-fixture"]).to eq("volume-input")
    expect(input[:required]).to be_present
    expect(root[:name]).to be_nil
    expect(root["aria-label"]).to be_nil

    find("label[for='volume']").click
    expect(page.evaluate_script("document.activeElement.id")).to eq("volume")
  end

  it "synchronizes the horizontal range and thumb after native keyboard input and submits the value" do
    visit "/pages/slider"

    page.execute_script("document.querySelector('#volume').focus()")
    range = find("#volume", visible: :all).ancestor("[data-slot='slider']").find("[data-slot='slider-range']")
    thumb = find("#volume", visible: :all).ancestor("[data-slot='slider']").find("[data-slot='slider-thumb']")

    expect(range.evaluate_script("this.style.width")).to eq("37.5%")
    expect(thumb.evaluate_script("this.style.left")).to eq("37.5%")

    press_key(:right)
    expect(find("#volume", visible: :all).value).to eq("45")
    expect(range.evaluate_script("this.style.width")).to eq("43.75%")
    expect(thumb.evaluate_script("this.style.left")).to eq("43.75%")

    press_key(:end)
    expect(find("#volume", visible: :all).value).to eq("90")
    expect(range.evaluate_script("this.style.width")).to eq("100%")
    expect(thumb.evaluate_script("this.style.left")).to eq("100%")

    click_button "送信"
    expect(page).to have_selector("#echo-result", text: "90")
  end

  it "synchronizes the native range and decoration after pointer input" do
    visit "/pages/slider"

    input = find("#volume", visible: :all)
    root = input.ancestor("[data-slot='slider']")
    range = root.find("[data-slot='slider-range']")
    thumb = root.find("[data-slot='slider-thumb']")
    rect = page.evaluate_script(<<~JS)
      (() => {
        const rect = document.getElementById("volume").getBoundingClientRect()
        return { x: rect.left + rect.width * 0.75, y: rect.top + rect.height / 2 }
      })()
    JS

    page.driver.browser.mouse.click(x: rect.fetch("x"), y: rect.fetch("y"))

    expect(input.value).to eq("70")
    percentage = ((input.value.to_f - 10) / 80) * 100
    expect(range.evaluate_script("parseFloat(this.style.width)")).to be_within(0.01).of(percentage)
    expect(thumb.evaluate_script("parseFloat(this.style.left)")).to be_within(0.01).of(percentage)
  end

  it "synchronizes vertical geometry while keeping the thumb centered" do
    visit "/pages/slider"

    input = find("#temperature", visible: :all)
    root = input.ancestor("[data-slot='slider']")
    range = root.find("[data-slot='slider-range']")
    thumb = root.find("[data-slot='slider-thumb']")

    expect(root["data-orientation"]).to eq("vertical")
    expect(range.evaluate_script("this.style.height")).to eq("25%")
    expect(range.evaluate_script("this.style.width")).to eq("")
    expect(thumb.evaluate_script("this.style.bottom")).to eq("25%")
    expect(thumb.evaluate_script("this.style.left")).to eq("50%")

    page.execute_script("document.querySelector('#temperature').focus()")
    press_key(:up)

    expect(find("#temperature", visible: :all).value).to eq("30")
    expect(range.evaluate_script("this.style.height")).to eq("30%")
    expect(thumb.evaluate_script("this.style.bottom")).to eq("30%")
  end

  it "keeps a disabled range input inoperable" do
    visit "/pages/slider"

    expect(find("#disabled-volume", visible: :all)).to be_disabled
  end

  it "keeps the step-adjusted native default synchronized after Stimulus connects" do
    visit "/pages/slider"

    input = find("#native-default-volume", visible: :all)
    root = input.ancestor("[data-slot='slider']")
    range = root.find("[data-slot='slider-range']")
    thumb = root.find("[data-slot='slider-thumb']")

    expect(input.value).to eq("6")
    expect(range.evaluate_script("this.style.width")).to eq("60%")
    expect(thumb.evaluate_script("this.style.left")).to eq("60%")
  end
end
