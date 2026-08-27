# frozen_string_literal: true

module Shadcn
  class HoverCardPreview < ViewComponent::Preview
    def default
      render(Shadcn::HoverCard.new) do
        safe_join([
          render(Shadcn::HoverCard::Trigger.new(href: "#")) { "@rails" },
          render(Shadcn::HoverCard::Content.new) do
            "Ruby on Rails — ホバーで表示されるカードです"
          end
        ])
      end
    end
  end
end
