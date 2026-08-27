# frozen_string_literal: true

module Shadcn
  class TextareaPreview < ViewComponent::Preview
    def default
      render(Shadcn::Textarea.new(placeholder: "自由入力"))
    end
  end
end
