# frozen_string_literal: true

module Shadcn
  class ChartPreview < Shadcn::PreviewBase
    def default
      safe_join([
                  render(Shadcn::Chart::Container.new(role: "img", aria: { label: "月別売上" })) do
                    content_tag(:div, "1月 40、2月 65、3月 80", class: "p-4 text-sm")
                  end,
                  render(Shadcn::Chart::LegendContent.new) { "売上（万円）" }
                ])
    end
  end
end
