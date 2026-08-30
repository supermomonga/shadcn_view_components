# frozen_string_literal: true

require "rails_helper"

RSpec.describe(
  "Input OTP behavior",
  type: :system,
  component_coverage: { "input-otp" => %i[pointer keyboard state form no_js accessibility] }
) do
  define_method(:press_key) do |key|
    page.driver.browser.page.keyboard.type(key)
  end

  define_method(:input_root) do |id|
    find("##{id}", visible: :all).ancestor("[data-controller~='shadcn--input-otp']")
  end

  define_method(:slot) do |id, index|
    input_root(id).find("[data-slot='input-otp-slot'][data-index='#{index}']")
  end

  define_method(:replace_through_native_input) do |id, value, input_type|
    page.execute_script(<<~JS)
      (() => {
        const input = document.querySelector(#{"##{id}".to_json})
        input.value = #{value.to_json}
        input.setSelectionRange(input.value.length, input.value.length)
        input.dispatchEvent(new InputEvent("input", {
          bubbles: true,
          composed: true,
          data: #{value.to_json},
          inputType: #{input_type.to_json}
        }))
      })()
    JS
  end

  it "renders the initial value into the standard length slots" do
    visit "/pages/input_otp"

    expect(find("#verification-code", visible: :all).value).to eq("12")
    expect(input_root("verification-code")).to have_css("[data-slot='input-otp-slot']", count: 6)
    expect(slot("verification-code", 0)).to have_text("1")
    expect(slot("verification-code", 1)).to have_text("2")
    (2..5).each { |index| expect(slot("verification-code", index).text).to be_empty }
  end

  it "forwards form and ARIA attributes to the real input, links its label, and submits its value" do
    visit "/pages/input_otp"

    input = find("#verification-code", visible: :all)
    expect(input[:name]).to eq("q")
    expect(input[:maxlength]).to eq("6")
    expect(input[:inputmode]).to eq("numeric")
    expect(input[:autocomplete]).to eq("one-time-code")
    expect(input[:required]).to be_present
    expect(input["aria-describedby"]).to eq("verification-help")

    find("label[for='verification-code']").click
    expect(page.evaluate_script("document.activeElement.id")).to eq("verification-code")

    page.execute_script("document.querySelector('#verification-code').setSelectionRange(2, 2)")
    page.driver.browser.page.keyboard.type("3456")
    click_button "送信"

    expect(page).to have_selector("#echo-result", text: "123456")
  end

  it "synchronizes trusted typing and deletion from the real input" do
    visit "/pages/input_otp"

    page.execute_script(<<~JS)
      const input = document.querySelector("#verification-code")
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    JS
    page.driver.browser.page.keyboard.type("3")

    expect(find("#verification-code", visible: :all).value).to eq("123")
    expect(slot("verification-code", 2)).to have_text("3")

    press_key(:backspace)
    expect(find("#verification-code", visible: :all).value).to eq("12")
    expect(slot("verification-code", 2).text).to be_empty
  end

  it "accepts the browser paste input path and rejects the whole pattern-mismatching update" do
    visit "/pages/input_otp"

    # Headless ChromeのOS clipboardへ依存せず、pasteの既定処理後にブラウザが発火する
    # InputEvent(inputType=insertFromPaste)を実inputへ送る。pattern判定対象はこの値全体。
    replace_through_native_input("numeric-code", "123456", "insertFromPaste")
    expect(find("#numeric-code", visible: :all).value).to eq("123456")
    expect(slot("numeric-code", 5)).to have_text("6")

    replace_through_native_input("numeric-code", "12a345", "insertFromPaste")
    expect(find("#numeric-code", visible: :all).value).to eq("123456")
    expect((0..5).map { |index| slot("numeric-code", index).text }.join).to eq("123456")
  end

  it "treats inputmode as a keyboard hint rather than a character restriction" do
    visit "/pages/input_otp"

    replace_through_native_input("hint-only-code", "A1b2", "insertText")

    expect(find("#hint-only-code", visible: :all).value).to eq("A1b2")
    expect(slot("hint-only-code", 0)).to have_text("A")
    expect(slot("hint-only-code", 2)).to have_text("b")
  end

  it "synchronizes one-time-code autofill through the native input event" do
    visit "/pages/input_otp"

    replace_through_native_input("autofill-code", "654321", "insertReplacementText")

    expect(find("#autofill-code", visible: :all).value).to eq("654321")
    expect((0..5).map { |index| slot("autofill-code", index).text }.join).to eq("654321")
  end

  it "reflects collapsed carets and selection ranges in the active slots" do
    visit "/pages/input_otp"

    page.execute_script(<<~JS)
      const input = document.querySelector("#verification-code")
      input.focus()
      input.setSelectionRange(2, 2)
      document.dispatchEvent(new Event("selectionchange"))
    JS

    expect(slot("verification-code", 2)["data-active"]).to eq("true")
    expect(slot("verification-code", 2)).to have_css("[data-slot='input-otp-caret']:not([hidden])")
    [0, 1, 3, 4, 5].each do |index|
      expect(slot("verification-code", index)["data-active"]).to eq("false")
    end

    page.execute_script(<<~JS)
      const input = document.querySelector("#verification-code")
      input.setSelectionRange(0, 2)
      document.dispatchEvent(new Event("selectionchange"))
    JS

    expect(slot("verification-code", 0)["data-active"]).to eq("true")
    expect(slot("verification-code", 1)["data-active"]).to eq("true")
    expect(input_root("verification-code")).to have_css("[data-slot='input-otp-caret'][hidden]", count: 6, visible: :all)

    replace_through_native_input("verification-code", "123456", "insertReplacementText")
    page.execute_script(<<~JS)
      const input = document.querySelector("#verification-code")
      input.focus()
      input.setSelectionRange(6, 6)
      document.dispatchEvent(new Event("selectionchange"))
    JS

    selection = page.evaluate_script(<<~JS)
      (() => {
        const input = document.querySelector("#verification-code")
        return [input.selectionStart, input.selectionEnd, input.selectionDirection]
      })()
    JS
    expect(selection).to eq([5, 6, "backward"])

    press_key("9")
    expect(find("#verification-code", visible: :all).value).to eq("123459")
    expect(slot("verification-code", 5)).to have_text("9")
  end

  it "connects invalid state to its error and keeps disabled inputs inoperable" do
    visit "/pages/input_otp"

    invalid_input = find("#invalid-code", visible: :all)
    expect(invalid_input["aria-invalid"]).to eq("true")
    expect(invalid_input["aria-describedby"]).to eq("otp-error")
    expect(page).to have_selector("#otp-error", text: "認証コードが正しくありません")
    expect(input_root("invalid-code")).to have_css(
      "[data-slot='input-otp-slot'][aria-invalid='true']",
      count: 6
    )

    expect(find("#disabled-code", visible: :all)).to be_disabled
    expect(input_root("disabled-code")).to have_css("[data-input-otp-display][data-disabled]")
  end

  it "keeps the real input visible, operable, and submittable without JavaScript" do
    browser_page = page.driver.browser.page
    browser_page.command("Emulation.setScriptExecutionDisabled", value: true)

    visit "/pages/input_otp"

    input = find("#verification-code")
    styles = input.style("background-color", "color", "caret-color")

    expect(input).to be_visible
    expect(styles.fetch("background-color")).not_to eq("rgba(0, 0, 0, 0)")
    expect(styles.fetch("color")).not_to eq("rgba(0, 0, 0, 0)")
    expect(styles.fetch("caret-color")).not_to eq("rgba(0, 0, 0, 0)")

    find("label[for='verification-code']").click
    expect(page.evaluate_script("document.activeElement.id")).to eq("verification-code")

    press_key(:end)
    2.times { press_key(:backspace) }
    press_key("654321")
    expect(input.value).to eq("654321")
    expect(slot("verification-code", 0)).to have_text("1")

    click_button "送信"
    expect(page).to have_selector("#echo-result", text: "654321")
  ensure
    browser_page&.command("Emulation.setScriptExecutionDisabled", value: false)
  end
end
