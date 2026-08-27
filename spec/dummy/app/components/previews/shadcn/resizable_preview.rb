# frozen_string_literal: true

module Shadcn
  class ResizablePreview < ViewComponent::Preview
    def default
      render(Shadcn::Resizable::PanelGroup.new(style: "display: flex; height: 200px; width: 100%; border: 1px solid #ccc")) do
        safe_join([
          panel("左パネル"),
          render(Shadcn::Resizable::Handle.new),
          panel("右パネル")
        ])
      end
    end

    private

    def panel(text)
      render(Shadcn::Resizable::Panel.new) do
        content_tag(:div, style: "padding: 12px") { text }
      end
    end
  end
end
