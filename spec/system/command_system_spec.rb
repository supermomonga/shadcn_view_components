# frozen_string_literal: true

# Phase 3 wave3e(後半): command(フィルタ)と combobox(listbox)
require "rails_helper"

RSpec.describe "Command and Combobox behavior", type: :system do
  # CupriteのNode#send_keysは対象をclickしてから送る。clickでfocusが検索inputへ
  # 移るtriggerには使わず、既存focusへCDPから実キーを送る。
  define_method(:press_key) do |key|
    page.driver.browser.page.keyboard.type(key)
  end

  it "filters SSR'd command items by query and shows the empty state" do
    visit "/pages/commands"

    expect(find("#item-copy")).to be_visible
    expect(find("#command-empty", visible: :all)).not_to be_visible

    find("#command-input input").set("貼")
    expect(page).to have_selector("#item-paste")
    expect(find("#item-copy", visible: :all)).not_to be_visible
    expect(find("#item-cut", visible: :all)).not_to be_visible

    find("#command-input input").set("zzz")
    expect(page).to have_selector("#command-empty")
  end

  it "moves the highlight by exactly one item per arrow keypress (二重発火の回帰)" do
    visit "/pages/commands"

    expect(page).to have_selector("#item-copy[data-selected='true']")
    # 実キー操作で検証する:キーバインディングが二重(data-action + キャプチャリスナー)に
    # なると1回の押下で2項目進み、この検証が赤になる
    find("#command-input input").send_keys(:down)
    expect(page).to have_selector("#item-paste[data-selected='true']")
    expect(page).to have_selector("#item-copy[data-selected='false']")
  end

  it "opens the combobox listbox and filters items by query" do
    visit "/pages/commands"

    find("#combobox-demo [data-slot='input-group-button']").click
    find("#combobox-input").click
    expect(page.evaluate_script("document.querySelector('#combobox-content').matches(':popover-open')")).to be(true)
    expect(page).to have_selector("#cb-hanami")

    find("#combobox-input").set("zzz")
    expect(page).to have_selector("#combobox-empty")
    expect(find("#cb-rails", visible: :all)).not_to be_visible
    find("#combobox-input").send_keys(:enter)
    expect(page).to have_current_path("/pages/commands")
    expect(page).to have_no_selector("#submitted-profile")
  end

  it "selects a combobox item on click and closes the listbox" do
    visit "/pages/commands"

    find("#combobox-demo [data-slot='input-group-button']").click
    find("#cb-hanami").click

    # 閉じは exit アニメーション後に hidePopover されるため非表示への切替を待つ
    expect(page).to have_selector("#combobox-content", visible: :hidden)
    expect(find("#cb-hanami", visible: :hidden)[:"data-selected"]).to eq("true")
    expect(find("#combobox-input").value).to eq("Hanami Framework")
    # 選択チェック(upstream の ItemIndicator 相当)がクリックした項目へ移る
    expect(page.evaluate_script("document.querySelector('#cb-hanami [data-indicator]').hidden")).to be(false)
    expect(page.evaluate_script("document.querySelector('#cb-rails [data-indicator]').hidden")).to be(true)
  end

  it "moves focus from a keyboard-opened trigger and selects with Arrow and Enter" do
    visit "/pages/commands?empty=true"

    page.execute_script("document.querySelector('#combobox-demo [data-slot=input-group-button]').focus()")
    press_key(:enter)
    expect(page.evaluate_script("document.activeElement === document.querySelector('#combobox-input')")).to be(true)
    press_key(:down)
    expect(page).to have_selector("#cb-hanami[data-highlighted]")
    press_key(:enter)

    expect(page).to have_selector("#combobox-content", visible: :hidden)
    expect(find("#combobox-input").value).to eq("Hanami Framework")
    expect(page.evaluate_script(<<~JS)).to eq("hanami")
      document.querySelector("#combobox [data-slot='combobox-form-control']").value
    JS
  end

  it "commits a new chip on Enter and removes chips via the remove button" do
    visit "/pages/commands"

    input = find("#combobox-chip-input")
    input.set("Sinatra")
    input.send_keys(:enter)

    expect(page).to have_selector("#combobox-chips-box [data-slot='combobox-chip']", text: "Sinatra")
    expect(page).to have_selector("#combobox-chips-box [data-slot='combobox-chip']", count: 3)
    expect(input.value).to eq("")

    # 動的に追加したchipでも削除ボタンが効くこと(Stimulusアクションの後からの接線)
    find("#combobox-chips-box [data-slot='combobox-chip']", text: "Sinatra")
      .find("[data-slot='combobox-chip-remove']").click
    expect(page).to have_selector("#combobox-chips-box [data-slot='combobox-chip']", count: 2)

    # 全chipを削除しても、複製元(接続時に確保)から完全なマークアップのchipを追加できる
    2.times { first("#combobox-chips-box [data-slot='combobox-chip-remove']").click }
    expect(page).to have_selector("#combobox-chips-box [data-slot='combobox-chip']", count: 0)

    input.set("Zzz")
    input.send_keys(:enter)
    expect(page).to have_selector("#combobox-chips-box [data-slot='combobox-chip']", text: "Zzz")
    find("#combobox-chips-box [data-slot='combobox-chip']", text: "Zzz")
      .find("[data-slot='combobox-chip-remove']").click
    expect(page).to have_selector("#combobox-chips-box [data-slot='combobox-chip']", count: 0)
  end

  it "submits option values and the updated chips array through the Rails controller" do
    visit "/pages/commands"

    expect(find("#combobox-input").value).to eq("Ruby on Rails")
    expect(find("#combobox [data-slot='combobox-form-control']", visible: :all).value).to eq("rails")
    find("#combobox-demo [data-slot='input-group-button']").click
    find("#cb-hanami").click

    find("#combobox-chips-box [data-slot='combobox-chip']", text: "Rails")
      .find("[data-slot='combobox-chip-remove']").click
    find("#combobox-chips-trigger").click
    find("#combobox-chip-input").click
    expect(page.evaluate_script(<<~JS)).to be(true)
      document.querySelector("#combobox-chips-content").matches(":popover-open")
    JS
    find("#chip-option-view-component").click

    chip_input = find("#combobox-chip-input")
    chip_input.set("Sinatra")
    chip_input.send_keys(:enter)

    click_button "送信する"

    expect(page).to have_selector("#submitted-profile[data-status='accepted']")
    expect(find("#submitted-framework")["data-value"]).to eq("hanami")
    expect(all("#submitted-tags [data-value]").map { |tag| tag["data-value"] })
      .to eq(%w[hanami view_component Sinatra])
  end

  it "does not submit blank or duplicate chip values" do
    visit "/pages/commands"

    chip_input = find("#combobox-chip-input")
    chip_input.set("Sinatra")
    chip_input.send_keys(:enter)
    chip_input.set(" Sinatra ")
    chip_input.send_keys(:enter)
    chip_input.set("   ")
    chip_input.send_keys(:enter)

    expect(page).to have_selector("#combobox-chips-box [data-slot='combobox-chip']", count: 3)

    3.times { first("#combobox-chips-box [data-slot='combobox-chip-remove']").click }
    chip_input.set("   ")
    chip_input.send_keys(:enter)
    expect(page).to have_selector("#combobox-chips-box [data-slot='combobox-chip']", count: 0)

    click_button "送信する"

    submitted = find("#submitted-profile")
    expect(submitted["data-tags-parameter-present"]).to eq("true")
    expect(submitted["data-raw-tags"]).to eq('[""]')
    expect(all("#submitted-tags [data-value]").map { |tag| tag["data-value"] })
      .to be_empty
  end

  it "does not replace a committed single value with a closed-list highlight on Enter" do
    visit "/pages/commands"

    find("#combobox-demo [data-slot='input-group-button']").click
    find("#cb-hanami").click
    page.execute_script(<<~JS)
      document.querySelector("#combobox-form").addEventListener("submit", (event) => {
        event.preventDefault()
      }, { once: true })
    JS
    find("#combobox-input").send_keys(:enter)

    expect(page.evaluate_script(<<~JS)).to eq("hanami")
      document.querySelector("#combobox [data-slot='combobox-form-control']").value
    JS
  end

  it "keeps submitted values when validation rerenders the form with 422" do
    visit "/pages/commands"

    find("#combobox-demo [data-slot='input-group-button']").click
    find("#cb-hanami").click
    chip_input = find("#combobox-chip-input")
    chip_input.set("invalid")
    chip_input.send_keys(:enter)
    click_button "送信する"

    expect(page.status_code).to eq(422)
    expect(page).to have_selector("#combobox-error", text: "invalid はタグとして使用できません")
    expect(page).to have_selector("#submitted-profile[data-status='rejected']")
    expect(find("#submitted-framework")["data-value"]).to eq("hanami")
    expect(find("#combobox-input").value).to eq("Hanami Framework")
    expect(page).to have_selector("#combobox-chips-box [data-slot='combobox-chip'][data-value='invalid']")

    find("#combobox-chips-box [data-slot='combobox-chip'][data-value='invalid']")
      .find("[data-slot='combobox-chip-remove']").click
    click_button "送信する"

    expect(page).to have_selector("#submitted-profile[data-status='accepted']")
    expect(all("#submitted-tags [data-value]").map { |tag| tag["data-value"] })
      .to eq(%w[rails hanami])
  end

  it "omits a disabled combobox from the submitted Rails params" do
    visit "/pages/commands?disabled=true"

    expect(page.evaluate_script(<<~JS)).to be(true)
      document.querySelector("#combobox [data-slot='combobox-form-control']").disabled
    JS
    click_button "送信する"

    expect(page).to have_selector("#submitted-profile[data-status='accepted']")
    expect(find("#submitted-framework")["data-present"]).to eq("false")
    expect(all("#submitted-tags [data-value]").map { |tag| tag["data-value"] })
      .to eq(%w[rails hanami])
  end

  it "uses native required validation for an empty combobox" do
    visit "/pages/commands?empty=true"

    expect(page.evaluate_script(<<~JS)).to be(false)
      document.querySelector("#combobox [data-slot='combobox-form-control']").checkValidity()
    JS
    click_button "送信する"

    expect(page).to have_current_path("/pages/commands?empty=true")
    expect(page).to have_no_selector("#submitted-profile")
    expect(page.evaluate_script("document.activeElement === document.querySelector('#combobox-input')")).to be(true)

    find("#combobox-demo [data-slot='input-group-button']").click
    find("#cb-hanami").click
    expect(page.evaluate_script(<<~JS)).to be(true)
      document.querySelector("#combobox [data-slot='combobox-form-control']").checkValidity()
    JS
  end
end
