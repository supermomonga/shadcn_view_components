# frozen_string_literal: true

module Shadcn
  class AspectRatioPreview < Shadcn::PreviewBase
    def default
      # ratio はCSS aspect-ratio に渡す有限の正数(厳密な数値文字列も可)。Rational は契約外
      render(Shadcn::AspectRatio.new(ratio: 16.0 / 9, class: "bg-muted")) { "16 / 9" }
    end
  end
end
