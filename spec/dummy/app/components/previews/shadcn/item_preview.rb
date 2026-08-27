# frozen_string_literal: true

module Shadcn
  class ItemPreview < ViewComponent::Preview
    def default
      render(Shadcn::Item::Group.new) do
        safe_join([
          render(Shadcn::Item.new) do
            safe_join([render(Shadcn::Item::Media.new) { "🔑" },
                       render(Shadcn::Item::Content.new) do
                         safe_join([render(Shadcn::Item::Title.new) { "タイトル" }, render(Shadcn::Item::Description.new) { "説明" }])
                       end])
          end,
          render(Shadcn::Item::Separator.new),
          render(Shadcn::Item.new(variant: :muted, size: :sm)) do
            render(Shadcn::Item::Content.new) { "ミュート項目" }
          end
        ])
      end
    end
  end
end
