# frozen_string_literal: true

module Shadcn
  class TooltipPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Tooltip::Provider.new) do
        render(Shadcn::Tooltip.new) do
          safe_join([
            render(Shadcn::Tooltip::Trigger.new(variant: :outline)) { "ホバーしてね" },
            render(Shadcn::Tooltip::Content.new(id: "preview-tip")) { "ツールチップの内容" }
          ])
        end
      end
    end
  end
end
