# frozen_string_literal: true

# Phase 3: ネイティブ <dialog> の挙動(10-roadmap DoD / 05 §4)。
# Esc で閉じる・背景inert・フォーカス復帰・ARIA参照・
# turbo:submit-end 標準フックを検証する
require "rails_helper"

RSpec.describe(
  "Dialog behavior",
  type: :system,
  component_coverage: {
    "dialog" => %i[pointer keyboard state form accessibility],
    "alert-dialog" => %i[pointer keyboard state accessibility]
  }
) do
  it "opens with showModal, marks the trigger expanded, and closes via the close button" do
    visit "/pages/dialogs"

    dialog = find("#demo-dialog", visible: :all)
    expect(dialog["open"]).to be_falsey
    expect(find("#open-dialog")["aria-expanded"]).to eq("false")
    expect(find("#open-dialog")["aria-controls"]).to eq("demo-dialog")
    expect(dialog["aria-labelledby"]).to eq(dialog.find("[data-slot='dialog-title']", visible: :all)["id"])
    expect(dialog["aria-describedby"]).to eq(dialog.find("[data-slot='dialog-description']", visible: :all)["id"])

    find("#open-dialog").click
    expect(page.evaluate_script("document.querySelector('#demo-dialog').open")).to be(true)
    expect(find("#open-dialog")["aria-expanded"]).to eq("true")

    find("#close-dialog").click
    expect(page).to have_no_selector("#demo-dialog[open]", visible: :all)
    expect(page).to have_selector("#open-dialog[aria-expanded='false']")
    # close() は開く前にフォーカスがあった要素(trigger)へ復帰する(ネイティブ保証)。
    # 復帰はマイクロタスクで行われるため再試行付きで検証する
    expect(page).to have_selector("#open-dialog:focus")
  end

  it "closes on Escape" do
    visit "/pages/dialogs"

    find("#open-dialog").click
    # showModal は最初のフォーカス可能要素へフォーカスを置く(ネイティブの挙動)
    expect(page.evaluate_script("document.activeElement.closest('dialog') !== null")).to be(true)

    # Esc(cancel)で閉じる。フォーカス復帰の検証はボタン経路で行う
    find("#demo-dialog").send_keys(:escape)
    expect(page.evaluate_script("document.querySelector('#demo-dialog').open")).to be(false)
  end

  it "keeps the background inert while open (focus stays inside the dialog)" do
    visit "/pages/dialogs"

    find("#open-dialog").click
    expect(page.evaluate_script("document.activeElement.closest('dialog') !== null")).to be true

    5.times { find("#demo-dialog").send_keys(:tab) }
    expect(page.evaluate_script("document.activeElement.closest('dialog') !== null")).to be(true)
  end

  it "closes an alertdialog with Escape or an explicit button" do
    visit "/pages/dialogs"

    find("#open-alert").click
    expect(page.evaluate_script("document.querySelector('#demo-alert').open")).to be(true)

    find("#demo-alert").send_keys(:escape)
    expect(page.evaluate_script("document.querySelector('#demo-alert').open")).to be(false)

    find("#open-alert").click
    find("#cancel-alert").click
    expect(page).to have_no_selector("#demo-alert[open]", visible: :all)
  end

  it "closes on turbo:submit-end from a form inside the dialog (標準フック)" do
    visit "/pages/dialogs"

    find("#open-form-dialog").click
    expect(page.evaluate_script("document.querySelector('#form-dialog').open")).to be(true)

    # dummyアプリはTurboを載せていないため、ホストでのイベントを合成して配線を検証する
    page.execute_script(<<~JS)
      const form = document.querySelector("#form-dialog form")
      form.dispatchEvent(new Event("turbo:submit-end", { bubbles: true }))
    JS
    expect(page).to have_no_selector("#form-dialog[open]", visible: :all)
  end
end
