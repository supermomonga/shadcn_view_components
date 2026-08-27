# frozen_string_literal: true

module Shadcn
  class ToggleGroupPreview < ViewComponent::Preview
    def multiple
      render(Shadcn::ToggleGroup.new(variant: :outline)) do
        safe_join([
          render(Shadcn::ToggleGroup::Item.new(state: :on)) { "太字" },
          render(Shadcn::ToggleGroup::Item.new) { "斜体" },
          render(Shadcn::ToggleGroup::Item.new) { "下線" }
        ])
      end
    end

    def single
      render(Shadcn::ToggleGroup.new(type: :single, variant: :outline)) do
        safe_join([
          render(Shadcn::ToggleGroup::Item.new(state: :on, size: :sm)) { "日" },
          render(Shadcn::ToggleGroup::Item.new(size: :sm)) { "週" },
          render(Shadcn::ToggleGroup::Item.new(size: :sm)) { "月" }
        ])
      end
    end
  end
end
