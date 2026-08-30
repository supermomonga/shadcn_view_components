# frozen_string_literal: true

# システムスペック(層3 — 07-testing §5)。Phase 0 は dialog 未実装のため最小構成。
# dummyアプリのimportmap経由で「エンジンの自動pin → shadcnモジュール → Stimulus登録」の
# ESMチェーンが実ブラウザで起動することと、ボタンのフォーム送信を検証する。
require "rails_helper"

RSpec.describe(
  "Button system behavior",
  type: :system,
  component_coverage: { "button" => %i[pointer keyboard form] }
) do
  it "boots the ESM chain: importmap → shadcn module → Stimulus register" do
    visit "/pages/button"

    expect(page).to have_selector("html[data-stimulus-ready]", wait: 10)
  end

  it "renders the button page with variants" do
    visit "/pages/button"

    expect(page).to have_selector("button[data-slot='button']", count: 2)
    expect(page).to have_button("保存")
    expect(page).to have_button("キャンセル")
  end

  it "submits a form on button click" do
    visit "/pages/button"

    click_button "保存"

    expect(page).to have_selector("#echo-result", text: "submitted-from-button")
  end

  it "submits a form when the focused button is activated with Enter" do
    visit "/pages/button"

    page.execute_script("document.querySelector('#echo-form button').focus()")
    page.driver.browser.page.keyboard.type(:enter)

    expect(page).to have_selector("#echo-result", text: "submitted-from-button")
  end

  it "renders the tag-swapped button as a link" do
    visit "/pages/button"

    expect(page).to have_link("リンク", href: /link-clicked/)
  end
end
