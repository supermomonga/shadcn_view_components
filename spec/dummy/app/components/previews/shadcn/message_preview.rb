# frozen_string_literal: true

module Shadcn
  class MessagePreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Message::Group.new(aria: { label: "会話" })) do
        render(Shadcn::Message.new) do
          safe_join([
                      render(Shadcn::Message::Avatar.new(aria: { hidden: "true" })) { "🤖" },
                      render(Shadcn::Message::Content.new) do
                        safe_join([
                                    render(Shadcn::Message::Header.new) { "アシスタント" },
                                    content_tag(:p, "ご用件をお聞かせください。"),
                                    render(Shadcn::Message::Footer.new) { "たった今" }
                                  ])
                      end
                    ])
        end
      end
    end
  end
end
