# frozen_string_literal: true

module Shadcn
  class SeparatorPreview < Shadcn::PreviewBase
    def horizontal
      render(Shadcn::Separator.new)
    end

    def vertical
      render(Shadcn::Separator.new(orientation: :vertical, class: "h-8"))
    end
  end
end
