# frozen_string_literal: true

module Shadcn
  class SwitchPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Switch.new(id: "switch", name: "switch", aria: { label: "通知" }))
    end

    def checked
      render(Shadcn::Switch.new(checked: true, aria: { label: "通知オン" }))
    end

    def unchecked
      render(Shadcn::Switch.new(checked: false, aria: { label: "通知オフ" }))
    end

    def small
      render(Shadcn::Switch.new(size: :sm, name: "switch-sm"))
    end
  end
end
