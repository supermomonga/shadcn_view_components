# frozen_string_literal: true

module Shadcn
  class ToggleGroupPreview < Shadcn::PreviewBase
    def multiple
      render(Shadcn::ToggleGroup.new(variant: :outline)) do
        safe_join([
          render(Shadcn::ToggleGroup::Item.new(state: :on, variant: :outline)) { "太字" },
          render(Shadcn::ToggleGroup::Item.new(variant: :outline)) { "斜体" },
          render(Shadcn::ToggleGroup::Item.new(variant: :outline)) { "下線" }
        ])
      end
    end

    def single
      render(Shadcn::ToggleGroup.new(type: :single, variant: :outline)) do
        safe_join([
          render(Shadcn::ToggleGroup::Item.new(state: :on, variant: :outline, size: :sm)) { "日" },
          render(Shadcn::ToggleGroup::Item.new(variant: :outline, size: :sm)) { "週" },
          render(Shadcn::ToggleGroup::Item.new(variant: :outline, size: :sm)) { "月" }
        ])
      end
    end
  end
end
