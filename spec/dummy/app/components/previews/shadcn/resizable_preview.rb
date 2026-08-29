# frozen_string_literal: true

module Shadcn
  class ResizablePreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Resizable::PanelGroup.new(style: "display: flex; height: 200px; width: 100%; border: 1px solid #ccc")) do
        safe_join([
          panel("左パネル"),
          render(Shadcn::Resizable::Handle.new),
          panel("右パネル")
        ])
      end
    end

    def vertical
      render(Shadcn::Resizable::PanelGroup.new(orientation: :vertical,
                                               style: "display: flex; height: 200px; width: 100%; border: 1px solid #ccc")) do
        safe_join([
          panel("上パネル"),
          # ハンドル(セパレータ)自身の向きはグループの逆になる
          render(Shadcn::Resizable::Handle.new(orientation: :horizontal)),
          panel("下パネル")
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
