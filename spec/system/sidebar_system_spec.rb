# frozen_string_literal: true

# Phase 4: sidebar の開閉と、Turboキャッシュ復帰相当の再接続での冪等性(05 §6.2)
require "rails_helper"

RSpec.describe "Sidebar behavior", type: :system do
  it "toggles data-state and aria-expanded via the trigger" do
    visit "/pages/sidebar"

    provider = find("#sidebar-provider")
    expect(provider["data-state"]).to eq("open")
    expect(find("#demo-sidebar")["data-state"]).to eq("open")

    find("#sidebar-trigger").click
    expect(provider["data-state"]).to eq("closed")
    expect(find("#demo-sidebar")["data-state"]).to eq("closed")
    expect(find("#sidebar-trigger")["aria-expanded"]).to eq("false")

    find("#sidebar-trigger").click
    expect(provider["data-state"]).to eq("open")
  end

  it "survives a cache-restored DOM reconnection (Turbo cache 相当)" do
    visit "/pages/sidebar"

    find("#sidebar-trigger").click
    expect(find("#sidebar-provider")["data-state"]).to eq("closed")

    # Turboキャッシュから復帰した状況を再現: ノードを複製して差し替える。
    # data-state はDOMごと保持され、再接続後も操作が壊れないことを検証する
    page.execute_script(<<~JS)
      const original = document.querySelector("#sidebar-provider")
      const restored = original.cloneNode(true)
      original.replaceWith(restored)
    JS
    expect(find("#sidebar-provider")["data-state"]).to eq("closed")

    find("#sidebar-trigger").click
    expect(find("#sidebar-provider")["data-state"]).to eq("open")
    expect(find("#sidebar-trigger")["aria-expanded"]).to eq("true")
  end
end
