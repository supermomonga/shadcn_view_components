# frozen_string_literal: true

module Shadcn
  class CheckboxPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Checkbox.new(id: "check", name: "check"))
    end

    def disabled
      render(Shadcn::Checkbox.new(disabled: true))
    end
  end
end
