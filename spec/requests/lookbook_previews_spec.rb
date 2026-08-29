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

  # display option「theme」(light/dark)はdummyレイアウトが _display パラメータと
  # クッキーから <html class="dark"> へ反映する(06-theming §3)。
  # Lookbookのセレクト操作実体は「クッキー + URLの_display更新 + iframeリロード」
  describe "テーマ切り替え(display option theme)" do
    define_method(:encoded_display) do |params|
      CGI.escape(JSON.generate(params))
    end

    it "パラメータ無しの既定はライトで描画される" do
      get "/lookbook/preview/shadcn/button/default"

      expect(response.body).not_to include(%(<html lang="ja" class="dark">))
      expect(response.body).not_to include("background-color: var(--background)")
    end

    it "_display パラメータの theme:dark でダークになる" do
      get "/lookbook/preview/shadcn/button/default?_display=#{encoded_display(theme: 'dark')}"

      expect(response.body).to include(%(<html lang="ja" class="dark">))
      expect(response.body).to include("background-color: var(--background)")
    end

    it "theme:light の _display はクッキーより優先されてライトに戻る" do
      cookies["lookbook-display-theme"] = "dark"
      get "/lookbook/preview/shadcn/button/default?_display=#{encoded_display(theme: 'light')}"

      expect(response.body).not_to include(%(<html lang="ja" class="dark">))
    ensure
      cookies.delete("lookbook-display-theme")
    end

    it "_display 無しでもクッキー(lookbook-display-theme)でダークが永続化する" do
      cookies["lookbook-display-theme"] = "dark"
      get "/lookbook/preview/shadcn/button/default"

      expect(response.body).to include(%(<html lang="ja" class="dark">))
    ensure
      cookies.delete("lookbook-display-theme")
    end

    it "theme キーを含まない _display はライトで描画される" do
      get "/lookbook/preview/shadcn/button/default?_display=#{encoded_display(other: 'x')}"

      expect(response.body).not_to include(%(<html lang="ja" class="dark">))
      expect(response).to have_http_status(:ok)
    end

    it "インスペクタのテーマ切り替えはセレクトではなくトグルボタンで表示される" do
      get "/lookbook/inspect/shadcn/button/default"

      expect(response).to have_http_status(:ok)
      expect(response.body).not_to include('<select name="theme"')
      expect(response.body).to include('id="theme-toggle-button"')
    end
  end
end
