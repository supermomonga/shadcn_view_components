# frozen_string_literal: true

module Shadcn
  class ScrollAreaPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::ScrollArea.new(class: "h-48")) do
        safe_join(Array.new(20) { |i| content_tag(:div, "行 #{i + 1}", class: "p-2") })
      end
    end
  end
end
