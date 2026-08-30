# frozen_string_literal: true

require "rails_helper"

RSpec.describe(
  "Native checked state behavior",
  type: :system,
  component_coverage: {
    "checkbox" => %i[pointer keyboard state form reset reconnect no_js accessibility],
    "radio-group" => %i[pointer keyboard state form reset reconnect no_js accessibility],
    "switch" => %i[pointer keyboard state form reset reconnect no_js accessibility]
  }
) do
  define_method(:press_key) do |key|
    page.driver.browser.page.keyboard.type(key)
  end

  define_method(:checked_property) do |id|
    page.evaluate_script("document.getElementById(arguments[0]).checked", id)
  end

  define_method(:expect_checked_state) do |id, checked:|
    state = checked ? "checked" : "unchecked"
    opposite = checked ? "unchecked" : "checked"

    expect(page).to have_selector(
      "##{id}[data-#{state}]:not([data-#{opposite}])",
      visible: :all
    )
    expect(checked_property(id)).to eq(checked)
  end

  define_method(:computed_state_style) do |id|
    find("##{id}", visible: :all).style("background-color", "border-color")
  end

  it "keeps native, projected, visual, and accessible state aligned after pointer and keyboard input" do
    visit "/pages/checked_states"

    checkbox_checked_style = computed_state_style("newsletter")
    checkbox_indicator = find("#newsletter + [data-slot='checkbox-indicator']", visible: :all)
    expect_checked_state("newsletter", checked: true)
    expect(checkbox_indicator.style("display").fetch("display")).to eq("grid")

    find("label[for='newsletter']").click
    expect_checked_state("newsletter", checked: false)
    expect(computed_state_style("newsletter")).not_to eq(checkbox_checked_style)
    expect(checkbox_indicator.style("display").fetch("display")).to eq("none")

    switch_unchecked_style = computed_state_style("notifications")
    switch_thumb = find("#notifications + [data-slot='switch-thumb']", visible: :all)
    switch_unchecked_translate = switch_thumb.style("translate").fetch("translate")
    page.execute_script("document.getElementById('notifications').focus()")
    press_key(:space)
    expect_checked_state("notifications", checked: true)
    expect(computed_state_style("notifications")).not_to eq(switch_unchecked_style)
    expect(switch_thumb.style("translate").fetch("translate")).not_to eq(switch_unchecked_translate)

    page.execute_script("document.getElementById('plan-free').focus()")
    press_key(:right)
    expect_checked_state("plan-free", checked: false)
    expect_checked_state("plan-pro", checked: true)
    expect(find("#plan-free + [data-slot='radio-group-indicator']", visible: :all).style("display").fetch("display"))
      .to eq("none")
    expect(find("#plan-pro + [data-slot='radio-group-indicator']", visible: :all).style("display").fetch("display"))
      .to eq("flex")

    find("label[for='plan-enterprise']").click
    expect_checked_state("plan-free", checked: false)
    expect_checked_state("plan-pro", checked: false)
    expect(checked_property("plan-enterprise")).to be(true)
    expect(find("#plan-enterprise", visible: :all)["data-controller"]).to be_nil

    expect_checked_state("other-plan", checked: true)
    expect(find("#notifications", visible: :all)[:role]).to eq("switch")
    expect(find("#plan-group", visible: :all)[:role]).to eq("radiogroup")
    expect_no_accessibility_violations
  end

  it "restores each native default and its projected state after form reset" do
    visit "/pages/checked_states"

    find("label[for='newsletter']").click
    find("label[for='notifications']").click
    find("label[for='plan-pro']").click
    expect_checked_state("newsletter", checked: false)
    expect_checked_state("notifications", checked: true)
    expect_checked_state("plan-pro", checked: true)

    click_button "初期値に戻す"

    expect_checked_state("newsletter", checked: true)
    expect_checked_state("notifications", checked: false)
    expect_checked_state("plan-free", checked: true)
    expect_checked_state("plan-pro", checked: false)
    expect(checked_property("plan-enterprise")).to be(false)
    expect_checked_state("other-plan", checked: true)
  end

  it "defines programmatic changes as a checked assignment followed by a bubbling change event" do
    visit "/pages/checked_states"

    page.execute_script(<<~JS)
      for (const [id, checked] of [["newsletter", false], ["notifications", true], ["plan-pro", true]]) {
        const input = document.getElementById(id)
        input.checked = checked
        input.dispatchEvent(new Event("change", { bubbles: true }))
      }
    JS

    expect_checked_state("newsletter", checked: false)
    expect_checked_state("notifications", checked: true)
    expect_checked_state("plan-free", checked: false)
    expect_checked_state("plan-pro", checked: true)

    page.execute_script(<<~JS)
      const plainRadio = document.getElementById("plan-enterprise")
      plainRadio.checked = true
      plainRadio.dispatchEvent(new Event("change", { bubbles: true }))
    JS
    expect_checked_state("plan-free", checked: false)
    expect_checked_state("plan-pro", checked: false)
    expect(checked_property("plan-enterprise")).to be(true)

    values = page.evaluate_script(<<~JS)
      Object.fromEntries(new FormData(document.getElementById("native-checked-form")))
    JS
    expect(values).to eq("notifications" => "enabled", "plan" => "enterprise")
  end

  it "reconnects from the current property without restoring the original checked attribute" do
    visit "/pages/checked_states"

    find("label[for='newsletter']").click
    expect_checked_state("newsletter", checked: false)

    page.evaluate_async_script(<<~JS)
      const done = arguments[0]
      const input = document.getElementById("newsletter")
      const parent = input.parentNode
      const marker = input.nextSibling
      input.remove()
      requestAnimationFrame(() => requestAnimationFrame(() => {
        input.setAttribute("data-checked", "")
        input.removeAttribute("data-unchecked")
        parent.insertBefore(input, marker)
        done()
      }))
    JS

    expect_checked_state("newsletter", checked: false)
    checked_defaults = page.evaluate_script(<<~JS)
      (() => {
        const input = document.getElementById("newsletter")
        return [input.defaultChecked, input.hasAttribute("checked")]
      })()
    JS
    expect(checked_defaults).to eq([true, true])
  end

  it "keeps form values and visual state native when JavaScript is disabled" do
    browser_page = page.driver.browser.page
    browser_page.command("Emulation.setScriptExecutionDisabled", value: true)
    visit "/pages/checked_states"

    checkbox_checked_style = computed_state_style("newsletter")
    find("label[for='newsletter']").click
    expect(checked_property("newsletter")).to be(false)
    expect(computed_state_style("newsletter")).not_to eq(checkbox_checked_style)
    expect(find("#newsletter + [data-slot='checkbox-indicator']", visible: :all).style("display").fetch("display"))
      .to eq("none")

    switch_unchecked_style = computed_state_style("notifications")
    find("label[for='notifications']").click
    expect(checked_property("notifications")).to be(true)
    expect(computed_state_style("notifications")).not_to eq(switch_unchecked_style)

    find("label[for='plan-pro']").click
    expect(checked_property("plan-free")).to be(false)
    expect(checked_property("plan-pro")).to be(true)

    click_button "送信"
    query = Rack::Utils.parse_nested_query(URI.parse(page.current_url).query)
    expect(query).to eq("notifications" => "enabled", "plan" => "pro")
  ensure
    browser_page&.command("Emulation.setScriptExecutionDisabled", value: false)
  end
end
