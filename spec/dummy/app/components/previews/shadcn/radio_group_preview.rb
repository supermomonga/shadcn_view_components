# frozen_string_literal: true

module Shadcn
  class RadioGroupPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::RadioGroup.new(aria: { label: "プラン" })) do
        safe_join([
                    render(Shadcn::RadioGroup::Item.new(name: "plan", value: "free", aria: { label: "無料" })),
                    render(Shadcn::RadioGroup::Item.new(name: "plan", value: "pro", aria: { label: "プロ" }))
                  ])
      end
    end

    def checked
      render_item(checked: true, label: "選択済みプラン")
    end

    def unchecked
      render_item(checked: false, label: "未選択プラン")
    end

    private

    def render_item(checked:, label:)
      render(Shadcn::RadioGroup.new(aria: { label: "プラン" })) do
        render(Shadcn::RadioGroup::Item.new(name: "preview-plan", value: "pro", checked:, aria: { label: }))
      end
    end
  end
end
