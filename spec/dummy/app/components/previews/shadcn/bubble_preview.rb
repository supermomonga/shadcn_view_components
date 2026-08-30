# frozen_string_literal: true

module Shadcn
  class BubblePreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Bubble::Group.new) do
        render(Shadcn::Bubble.new) do
          safe_join([
                      render(Shadcn::Bubble::Content.new) { "ご質問ありがとうございます。" },
                      render(Shadcn::Bubble::Reactions.new(aria: { label: "リアクション" })) { "👍 2" }
                    ])
        end
      end
    end
  end
end
