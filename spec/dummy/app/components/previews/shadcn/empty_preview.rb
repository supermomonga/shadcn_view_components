# frozen_string_literal: true

module Shadcn
  class EmptyPreview < ViewComponent::Preview
    def default
      render(Shadcn::Empty.new) do
        render(Shadcn::Empty::Header.new) do
          safe_join([
            render(Shadcn::Empty::Media.new(variant: :icon)) { "☑" },
            render(Shadcn::Empty::Title.new) { "データがありません" },
            render(Shadcn::Empty::Description.new) { "新しい項目を追加してください" }
          ])
        end
      end
    end
  end
end
