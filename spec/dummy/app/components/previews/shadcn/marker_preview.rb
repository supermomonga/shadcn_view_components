# frozen_string_literal: true

module Shadcn
  class MarkerPreview < ViewComponent::Preview
    def default
      render(Shadcn::Marker.new) { render(Shadcn::Marker::Content.new) { "本文" } }
    end

    def variants
      safe_join(%i[default separator border].map do |variant|
        render(Shadcn::Marker.new(variant: variant)) { render(Shadcn::Marker::Content.new) { variant.to_s } }
      end)
    end
  end
end
