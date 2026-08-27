# frozen_string_literal: true

module Shadcn
  class SwitchPreview < ViewComponent::Preview
    def default
      render(Shadcn::Switch.new(id: "switch", name: "switch"))
    end

    def small
      render(Shadcn::Switch.new(size: :sm, name: "switch-sm"))
    end
  end
end
