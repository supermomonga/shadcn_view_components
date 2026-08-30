# frozen_string_literal: true

require "rails_helper"

RSpec.describe(
  "Coverage interaction fixtures",
  type: :system,
  component_coverage: {
    "collapsible" => %i[pointer keyboard state no_js],
    "message-scroller" => %i[pointer keyboard state],
    "native-select" => %i[pointer keyboard state form no_js accessibility],
    "sonner" => %i[event state timing accessibility]
  }
) do
  define_method(:press_key) do |key|
    page.driver.browser.page.keyboard.type(key)
  end

  it "opens and closes Collapsible through pointer and keyboard input" do
    visit "/pages/coverage_interactions"

    collapsible = find("#coverage-collapsible", visible: :all)
    trigger = find("#coverage-collapsible-trigger")
    expect(collapsible["open"]).to be_falsey

    trigger.click
    expect(collapsible["open"]).to be_truthy
    expect(page).to have_text("折りたたみ領域の内容")

    trigger.click
    expect(collapsible["open"]).to be_falsey

    page.execute_script("document.getElementById('coverage-collapsible-trigger').focus()")
    press_key(:enter)
    expect(collapsible["open"]).to be_truthy
  end

  it "keeps Collapsible operable without JavaScript" do
    browser_page = page.driver.browser.page
    browser_page.command("Emulation.setScriptExecutionDisabled", value: true)
    visit "/pages/coverage_interactions"

    find("#coverage-collapsible-trigger").click
    expect(find("#coverage-collapsible", visible: :all)["open"]).to be_truthy
    expect(page).to have_text("折りたたみ領域の内容")
  ensure
    browser_page&.command("Emulation.setScriptExecutionDisabled", value: false)
  end

  it "reveals the MessageScroller control away from the end and returns by click or Enter" do
    visit "/pages/coverage_interactions"

    page.execute_script(<<~JS)
      const viewport = document.getElementById("coverage-message-viewport")
      viewport.scrollTop = viewport.scrollHeight
      viewport.dispatchEvent(new Event("scroll"))
    JS
    expect(page).to have_selector("#coverage-message-bottom[hidden]", visible: :all)

    page.execute_script("document.getElementById('coverage-message-viewport').focus()")
    expect(page).to have_selector("#coverage-message-viewport:focus")
    press_key(:home)
    expect(page).to have_selector("#coverage-message-bottom:not([hidden])")

    find("#coverage-message-bottom").click
    expect(page).to have_selector("#coverage-message-bottom[hidden]", visible: :all)

    page.execute_script("document.getElementById('coverage-message-viewport').focus()")
    expect(page).to have_selector("#coverage-message-viewport:focus")
    press_key(:home)
    expect(page).to have_selector("#coverage-message-bottom:not([hidden])")

    page.execute_script("document.getElementById('coverage-message-bottom').focus()")
    press_key(:enter)
    expect(page).to have_selector("#coverage-message-bottom[hidden]", visible: :all)
  end

  it "keeps NativeSelect attributes on the real control and submits a keyboard selection" do
    visit "/pages/coverage_interactions"

    wrapper = find("[data-slot='native-select-wrapper']")
    select = find("#coverage-native-select")
    expect(select[:name]).to eq("coverage_choice")
    expect(select[:form]).to eq("coverage-native-select-form")
    expect(select[:required]).to be_present
    expect(select["aria-describedby"]).to eq("coverage-native-select-help")
    expect(select["data-fixture"]).to eq("native-select")
    expect(wrapper[:name]).to be_nil
    expect(wrapper[:form]).to be_nil
    expect(wrapper["aria-describedby"]).to be_nil

    find("label[for='coverage-native-select']").click
    expect(page.evaluate_script("document.activeElement.id")).to eq("coverage-native-select")
    press_key(:escape)
    expect(page).to have_selector("#coverage-native-select:focus")
    press_key("バ")
    expect(select.value).to eq("banana")
    expect_no_accessibility_violations

    find("#coverage-native-select-submit").click
    expect(page).to have_selector("#coverage-native-select-result", text: "banana")
  end

  it "selects and submits NativeSelect without JavaScript" do
    browser_page = page.driver.browser.page
    browser_page.command("Emulation.setScriptExecutionDisabled", value: true)
    visit "/pages/coverage_interactions"

    find("label[for='coverage-native-select']").click
    press_key("オ")
    expect(find("#coverage-native-select").value).to eq("orange")

    find("#coverage-native-select-submit").click
    expect(page).to have_selector("#coverage-native-select-result", text: "orange")
  ensure
    browser_page&.command("Emulation.setScriptExecutionDisabled", value: false)
  end

  it "renders CustomEvent notifications in the live region and removes them after their duration" do
    visit "/pages/coverage_interactions"

    toaster = find("#coverage-toaster")
    expect(toaster["aria-live"]).to eq("polite")
    expect(toaster["aria-label"]).to eq("通知")

    page.execute_script(<<~JS)
      window.dispatchEvent(new CustomEvent("shadcn:toast", {
        detail: { title: "保存しました", description: "変更を反映しました", duration: 0 }
      }))
    JS
    expect(page).to have_selector("#coverage-toaster article[role='status']", text: "保存しました")
    expect(page).to have_text("変更を反映しました")
    expect_no_accessibility_violations

    page.execute_script(<<~JS)
      window.dispatchEvent(new CustomEvent("shadcn:toast", {
        detail: { title: "自動で閉じます", duration: 250 }
      }))
    JS
    expect(page).to have_selector("#coverage-toaster article[role='status']", text: "自動で閉じます")
    expect(page).to have_selector("#coverage-toaster article[role='status']", count: 2)
    expect(page).to have_no_selector("#coverage-toaster article", text: "自動で閉じます", wait: 2)
    expect(page).to have_selector("#coverage-toaster article[role='status']", count: 1, text: "保存しました")
  end
end
