# frozen_string_literal: true

# Phase 2 の DoD(10-roadmap): form_with と各フォーム部品の統合。
# 値の送出とバリデーションエラー表示(aria-invalid / data-error / メッセージ要素)
require "rails_helper"

RSpec.describe "Form integration", type: :system do
  it "renders no message element when there is no error" do
    visit "/pages/form"

    expect(page).to have_field("email")
    expect(page).to have_no_selector("#email-message")
    expect(find("#subscribe-email")["aria-invalid"]).to eq("false")
    expect(find("label[for='subscribe-email']")["data-error"]).to eq("false")
  end

  it "shows validation error with aria-invalid linkage after submitting an invalid value" do
    visit "/pages/form"

    fill_in "email", with: "invalid"
    click_button "登録する"

    expect(page).to have_selector("#email-message", text: "有効なメールアドレスを入力してください")
    expect(find("#subscribe-email")["aria-invalid"]).to eq("true")
    expect(find("label[for='subscribe-email']")["data-error"]).to eq("true")
    expect(page).to have_text("送信できませんでした")
  end

  it "submits a valid value through form_with" do
    visit "/pages/form"

    fill_in "email", with: "user@example.com"
    click_button "登録する"

    expect(page).to have_text("登録しました: user@example.com")
    expect(page).to have_no_selector("#email-message")
  end
end
