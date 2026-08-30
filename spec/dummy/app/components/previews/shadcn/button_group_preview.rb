# frozen_string_literal: true

module Shadcn
  class ButtonGroupPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::ButtonGroup.new(aria: { label: "表示倍率" })) do
        safe_join([
                    render(Shadcn::Button.new(variant: :outline, size: :sm)) { "縮小" },
                    render(Shadcn::ButtonGroup::Separator.new),
                    render(Shadcn::ButtonGroup::Text.new) { "100%" },
                    render(Shadcn::ButtonGroup::Separator.new),
                    render(Shadcn::Button.new(variant: :outline, size: :sm)) { "拡大" }
                  ])
      end
    end
  end
end
