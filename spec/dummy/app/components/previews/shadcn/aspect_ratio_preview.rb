# frozen_string_literal: true

module Shadcn
  class AspectRatioPreview < Shadcn::PreviewBase
    def default
      # ratio はCSS aspect-ratio に渡す値(Integer/Float/String)。Rational は契約外
      render(Shadcn::AspectRatio.new(ratio: "16/9", class: "bg-muted")) { "16 / 9" }
    end
  end
end
