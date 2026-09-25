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

    expect(range.evaluate_script("this.style.width")).to eq("calc(37.5% + 1.5px)")
    expect(thumb.evaluate_script("this.style.left")).to eq("calc(37.5% + 1.5px)")

    press_key(:right)
    expect(find("#volume", visible: :all).value).to eq("45")
    expect(range.evaluate_script("this.style.width")).to eq("calc(43.75% + 0.75px)")
    expect(thumb.evaluate_script("this.style.left")).to eq("calc(43.75% + 0.75px)")

    press_key(:end)
    expect(find("#volume", visible: :all).value).to eq("90")
    expect(range.evaluate_script("this.style.width")).to eq("calc(100% - 6px)")
    expect(thumb.evaluate_script("this.style.left")).to eq("calc(100% - 6px)")

    click_button "送信"
    expect(page).to have_selector("#echo-result", text: "90")
  end

  it "synchronizes the native range and decoration after pointer input" do
    visit "/pages/slider"

    input = find("#volume", visible: :all)
    rect = page.evaluate_script(<<~JS)
      (() => {
        const rect = document.getElementById("volume").getBoundingClientRect()
        return { x: rect.left + rect.width * 0.75, y: rect.top + rect.height / 2 }
      })()
    JS

    page.driver.browser.mouse.click(x: rect.fetch("x"), y: rect.fetch("y"))

    expect(input.value).to eq("70")
    aligned_positions = page.evaluate_script(<<~JS)
      (() => {
        const root = document.querySelector('#volume').closest('[data-slot=slider]')
        const track = root.querySelector('[data-slot=slider-track]').getBoundingClientRect()
        const range = root.querySelector('[data-slot=slider-range]').getBoundingClientRect()
        const thumb = root.querySelector('[data-slot=slider-thumb]').getBoundingClientRect()
        const input = document.querySelector('#volume')
        const ratio = (input.valueAsNumber - 10) / 80
        return [track.left + thumb.width / 2 + ratio * (track.width - thumb.width), range.right, thumb.left + thumb.width / 2]
      })()
    JS
    expect(aligned_positions[1]).to be_within(0.03).of(aligned_positions[0])
    expect(aligned_positions[2]).to be_within(0.03).of(aligned_positions[0])
  end

  it "synchronizes vertical geometry while keeping the thumb centered" do
    visit "/pages/slider"

    input = find("#temperature", visible: :all)
    root = input.ancestor("[data-slot='slider']")
    range = root.find("[data-slot='slider-range']")
    thumb = root.find("[data-slot='slider-thumb']")

    expect(root["data-orientation"]).to eq("vertical")
    expect(range.evaluate_script("this.style.height")).to eq("calc(25% + 3px)")
    expect(range.evaluate_script("this.style.width")).to eq("")
    expect(thumb.evaluate_script("this.style.bottom")).to eq("calc(25% + 3px)")
    expect(thumb.evaluate_script("this.style.left")).to eq("50%")

    page.execute_script("document.querySelector('#temperature').focus()")
    press_key(:up)

    expect(find("#temperature", visible: :all).value).to eq("30")
    expect(range.evaluate_script("this.style.height")).to eq("calc(30% + 2.4px)")
    expect(thumb.evaluate_script("this.style.bottom")).to eq("calc(30% + 2.4px)")
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
    expect(range.evaluate_script("this.style.width")).to eq("calc(60% - 1.2px)")
    expect(thumb.evaluate_script("this.style.left")).to eq("calc(60% - 1.2px)")
  end
end
