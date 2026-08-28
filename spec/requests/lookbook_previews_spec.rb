# frozen_string_literal: true

require "rails_helper"

# Lookbook 上の全プレビューの回帰検証。
# Shadcn::PreviewBase 導入前は ViewComponent::Preview#render が返す
# ディスクリプタHashのinspect文字列がそのままプレビューに露出していた
# (safe_join で連結したネストコンポーネントが {args: [], block: #<Proc...>} と表示される)。
# 全exampleをHTTP経由で描画し、リークとステータス異常を検出する
RSpec.describe "Lookbook previews", type: :request do
  it "Lookbook のインデックスが表示される" do
    get "/lookbook"
    expect(response).to have_http_status(:ok)
  end

  it "プレビュー基底クラス自体はexampleを持たず一覧に出ない" do
    get "/lookbook"
    expect(response.body).not_to include("preview_base")
  end

  ViewComponent::Preview.all.sort_by(&:name).each do |preview|
    next if preview.examples.empty?

    preview.examples.sort.each do |example|
      it "#{preview.preview_name}/#{example} がディスクリプタを露出せず描画される" do
        get "/lookbook/preview/#{preview.preview_name}/#{example}"

        expect(response).to have_http_status(:ok)
        expect(response.body).not_to include("&lt;Proc")
        expect(response.body).not_to include("view_components/preview&quot;")
      end
    end
  end

  it "アコーディオンのプレビューはネストしたコンポーネントを実際のHTMLとして描画する" do
    get "/lookbook/preview/shadcn/accordion/default"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("<details")
    expect(response.body).to include("最初の項目")
  end
end
