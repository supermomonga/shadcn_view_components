# frozen_string_literal: true

module Shadcn
  class AspectRatioPreview < ViewComponent::Preview
    def default
      render(Shadcn::AspectRatio.new(ratio: Rational(16, 9), class: "bg-muted")) { "16 / 9" }
    end
  end
end
