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

  it "selects a combobox item on click and closes the listbox" do
    visit "/pages/commands"

    find("#combobox-input [data-slot='input-group-button']").click
    find("#cb-hanami").click

    # 閉じは exit アニメーション後に hidePopover されるため非表示への切替を待つ
    expect(page).to have_selector("#combobox-content", visible: :hidden)
    expect(find("#cb-hanami", visible: :hidden)[:"data-selected"]).to eq("true")
    expect(find("#combobox-input input").value).to eq("Hanami")
    # 選択チェック(upstream の ItemIndicator 相当)がクリックした項目へ移る
    expect(page.evaluate_script("document.querySelector('#cb-hanami [data-indicator]').hidden")).to be(false)
    expect(page.evaluate_script("document.querySelector('#cb-rails [data-indicator]').hidden")).to be(true)
  end

  it "selects the highlighted item with Enter and closes the listbox" do
    visit "/pages/commands"

    find("#combobox-input [data-slot='input-group-button']").click
    find("#combobox-input input").send_keys(:enter)

    expect(page).to have_selector("#combobox-content", visible: :hidden)
    expect(find("#combobox-input input").value).to eq("Ruby on Rails")
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
    find("#chip-rails [data-slot='combobox-chip-remove']").click
    find("#chip-hanami [data-slot='combobox-chip-remove']").click
    expect(page).to have_selector("#combobox-chips-box [data-slot='combobox-chip']", count: 0)

    input.set("Zzz")
    input.send_keys(:enter)
    expect(page).to have_selector("#combobox-chips-box [data-slot='combobox-chip']", text: "Zzz")
    find("#combobox-chips-box [data-slot='combobox-chip']", text: "Zzz")
      .find("[data-slot='combobox-chip-remove']").click
    expect(page).to have_selector("#combobox-chips-box [data-slot='combobox-chip']", count: 0)
  end
end
