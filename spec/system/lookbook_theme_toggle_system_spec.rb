# frozen_string_literal: true

# Lookbookプレビューのテーマトグルボタン(display option「theme」)のふるまい検証。
# ボタンはLookbook Fieldコンポーネントのテンプレートを差し替えたもの
# (config/initializers/lookbook_theme_toggle.rb 参照)で、
# 「クリック → Alpine(displayOptionsFieldComponent) → Cookie+_display 更新 →
#   iframeリロード → dummyレイアウトが <html class="dark"> を付与」
# という末端のループを実ブラウザで確認する
require "rails_helper"

RSpec.describe "Lookbook theme toggle", type: :system do
  before do
    driven_by :shadcn_cuprite
  end

  it "トグルをクリックするとプレビューiframeがダーク/ライトに切り替わる" do
    visit "/lookbook/inspect/shadcn/button/default"

    within_frame("preview-iframe") do
      expect(page).to have_selector("html:not(.dark)")
    end

    find("#theme-toggle-button").click
    # Lookbook JS(URLSearchParams)が _display 値をエンコードし、それをパスヘルパーが
    # 再エンコードするため、iframeのsrcはJSONが二重エンコードされた形になる
    dark_display = CGI.escape(CGI.escape(JSON.generate({ theme: "dark" })))
    expect(page).to have_selector(%(#preview-iframe[src*="_display=#{dark_display}"]), wait: 10)
    within_frame("preview-iframe") do
      expect(page).to have_selector("html.dark", wait: 10)
    end

    find("#theme-toggle-button").click
    expect(page).to have_no_selector(%(#preview-iframe[src*="_display=#{dark_display}"]), wait: 10)
    within_frame("preview-iframe") do
      expect(page).to have_no_selector("html.dark", wait: 10)
    end
  end
end
