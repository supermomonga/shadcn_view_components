# frozen_string_literal: true

module Shadcn
  class CheckboxPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Checkbox.new(id: "check", name: "check", aria: { label: "通知を受け取る" }))
    end

    def checked
      render(Shadcn::Checkbox.new(checked: true, aria: { label: "選択済み" }))
    end

    def unchecked
      render(Shadcn::Checkbox.new(checked: false, aria: { label: "未選択" }))
    end

    def disabled
      render(Shadcn::Checkbox.new(disabled: true))
    end
  end
end
