# frozen_string_literal: true

module Shadcn
  class CardPreview < ViewComponent::Preview
    def default
      render(Shadcn::Card.new) do
        safe_join([
          render(Shadcn::Card::Header.new) do
            safe_join([render(Shadcn::Card::Title.new) { "カードタイトル" }, render(Shadcn::Card::Description.new) { "説明" }])
          end,
          render(Shadcn::Card::Content.new) { "本文" },
          render(Shadcn::Card::Footer.new) { "フッター" }
        ])
      end
    end

    def with_action
      render(Shadcn::Card.new) do
        safe_join([
          render(Shadcn::Card::Header.new) do
            safe_join([
              render(Shadcn::Card::Title.new) { "タイトル" },
              render(Shadcn::Card::Action.new) { render(Shadcn::Button.new(variant: :ghost, size: :sm)) { "編集" } }
            ])
          end,
          render(Shadcn::Card::Content.new) { "本文" }
        ])
      end
    end
  end
end
