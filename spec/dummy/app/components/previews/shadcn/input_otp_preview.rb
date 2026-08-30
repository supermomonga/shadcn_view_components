# frozen_string_literal: true

module Shadcn
  # Previewはdummyアプリの標準inflectorで読み込まれるため、OTP acronymを要求しない定数名にする。
  class InputOtpPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::InputOTP.new(length: 6, value: "12", aria: { label: "認証コード" }))
    end
  end
end
