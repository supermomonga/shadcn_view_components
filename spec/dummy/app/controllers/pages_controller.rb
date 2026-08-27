# frozen_string_literal: true

class PagesController < ApplicationController
  def button; end

  def toggles; end

  def echo; end

  def tabs; end

  def dialogs; end

  def sheets; end

  def popovers; end

  def menus; end

  def carousel; end

  def form
    @email_error = nil
  end

  # Phase 2 の form_with 統合(10-roadmap DoD): 値の送出とバリデーションエラー表示。
  # モデルを用意せず、コントローラ側の素朴な検証で aria-invalid 連携を示す
  def submit_form
    email = params[:email].to_s.strip
    if email.match?(/\A[^@\s]+@[^@\s]+\z/)
      redirect_to pages_form_path, notice: "登録しました: #{email}"
    else
      @email_error = "有効なメールアドレスを入力してください"
      render :form, status: :unprocessable_entity
    end
  end
end
