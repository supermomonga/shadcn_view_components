# frozen_string_literal: true

module Shadcn
  class RadioGroupPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::RadioGroup.new) do
        safe_join([
          render(Shadcn::RadioGroup::Item.new(name: "plan", value: "free")),
          render(Shadcn::RadioGroup::Item.new(name: "plan", value: "pro"))
        ])
      end
    end
  end
end
