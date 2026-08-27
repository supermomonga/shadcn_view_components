# frozen_string_literal: true

module Shadcn
  class InputPreview < ViewComponent::Preview
    def default
      render(Shadcn::Input.new(type: :email, placeholder: "email@example.com"))
    end

    def disabled
      render(Shadcn::Input.new(placeholder: "無効", disabled: true))
    end
  end
end
