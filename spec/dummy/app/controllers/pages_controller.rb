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

  def commands
    @framework = params[:empty] == "true" ? nil : "rails"
    @tags = %w[rails hanami]
    @framework_disabled = params[:disabled] == "true"
    @combobox_error = nil
    @submitted_profile = nil
    @tags_parameter_present = nil
    @submitted_raw_tags = nil
  end

  def submit_commands
    profile = command_profile_params
    @framework = profile[:framework].presence
    @tags_parameter_present = profile.key?(:tags)
    @submitted_raw_tags = Array(profile[:tags]).map(&:to_s)
    @tags = @submitted_raw_tags.compact_blank
    @framework_disabled = false
    @submitted_profile = { framework: @framework, tags: @tags }

    if @tags.include?("invalid")
      @combobox_error = "invalid はタグとして使用できません"
      render :commands, status: :unprocessable_entity
    else
      @combobox_error = nil
      render :commands
    end
  end

  def select; end

  def input_otp; end

  def slider; end

  def checked_states; end

  def sidebar; end

  def calendar
    @month = Date.parse("#{params[:month]}-01")
  rescue ArgumentError, TypeError, Date::Error
    @month = Date.current.beginning_of_month
  end

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

  private

  def command_profile_params
    params.require(:profile).permit(:framework, tags: [])
  end
end
