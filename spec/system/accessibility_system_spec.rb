# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Representative preview accessibility", type: :system do
  scenarios = [
    { path: "dialog/default", open: %w[button 設定を開く], state: "[data-slot='dialog-content'][open]" },
    { path: "alert_dialog/accessibility", open: %w[button 変更を確認], state: "[data-slot='alert-dialog-content'][open]" },
    { path: "sheet/default", open: %w[button メニューを開く], state: "[data-slot='sheet-content'][open]" },
    { path: "drawer/default", open: %w[button ドロワーを開く], state: "dialog[open] [data-slot='drawer-content']" },
    { path: "tabs/default" },
    { path: "combobox/default", open: ["[data-slot='input-group-button']", nil], state: "[data-slot='combobox-content'][data-state='open']" },
    { path: "select/default", open: ["[data-slot='select-trigger']", nil], state: "[data-slot='select-content'][data-state='open']" },
    { path: "accordion/default", open: ["summary", nil], state: "details[open]" },
    { path: "resizable/default" },
    { path: "slider/default" },
    { path: "calendar/default" }
  ]

  scenarios.each do |scenario|
    it "scans shadcn/#{scenario.fetch(:path)} without WCAG violations" do
      visit "/preview/shadcn/#{scenario.fetch(:path)}"
      expect(page.status_code).to eq(200)

      open_selector, text = scenario[:open]
      find(open_selector, text:, match: :first).click if open_selector
      expect(page).to have_selector(scenario.fetch(:state)) if scenario[:state]

      expect_no_accessibility_violations
    end
  end
end
