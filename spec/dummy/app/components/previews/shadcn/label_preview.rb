# frozen_string_literal: true

module Shadcn
  class LabelPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Label.new) { "ラベル" }
    end

    def with_input
      safe_join([render(Shadcn::Label.new(for: "preview-email")) { "メール" },
                 render(Shadcn::Input.new(id: "preview-email", type: :email))])
    end
  end
end
