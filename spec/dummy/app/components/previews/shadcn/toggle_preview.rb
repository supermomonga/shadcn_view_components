# frozen_string_literal: true

module Shadcn
  class TogglePreview < ViewComponent::Preview
    def default
      render(Shadcn::Toggle.new) { "トグル" }
    end

    def variants
      safe_join(%i[default outline].map do |variant|
        render(Shadcn::Toggle.new(variant: variant)) { variant.to_s }
      end)
    end

    def sizes
      safe_join(%i[sm default lg].map do |size|
        render(Shadcn::Toggle.new(size: size)) { size.to_s }
      end)
    end

    def pressed
      render(Shadcn::Toggle.new(state: :on, variant: :outline)) { "オン" }
    end
  end
end
