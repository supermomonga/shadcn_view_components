# frozen_string_literal: true

module Shadcn
  class KbdPreview < ViewComponent::Preview
    def default
      render(Shadcn::Kbd.new) { "⌘" }
    end

    def group
      render(Shadcn::Kbd::Group.new) do
        safe_join([render(Shadcn::Kbd.new) { "⌘" }, render(Shadcn::Kbd.new) { "K" }])
      end
    end
  end
end
