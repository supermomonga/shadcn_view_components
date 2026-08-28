# frozen_string_literal: true

module Shadcn
  class BadgePreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Badge.new) { "Badge" }
    end

    def variants
      safe_join(%i[default secondary destructive outline ghost link].map do |variant|
        render(Shadcn::Badge.new(variant: variant)) { variant.to_s }
      end)
    end
  end
end
