# frozen_string_literal: true

# Phase 3 wave3e(後半): command(フィルタ)と combobox(listbox)
require "rails_helper"

RSpec.describe "Command and Combobox behavior", type: :system do
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

    find("#combobox-input [data-slot='input-group-button']").click
    expect(page.evaluate_script("document.querySelector('#combobox-content').matches(':popover-open')")).to be(true)
    expect(page).to have_selector("#cb-hanami")

    find("#combobox-input input").set("hanami")
    expect(page).to have_selector("#cb-hanami")
    expect(find("#cb-rails", visible: :all)).not_to be_visible
  end
end
