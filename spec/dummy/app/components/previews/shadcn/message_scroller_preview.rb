# frozen_string_literal: true

module Shadcn
  class MessageScrollerPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::MessageScroller.new) do
        render(Shadcn::MessageScroller::Provider.new) do
          safe_join([
                      render(Shadcn::MessageScroller::Viewport.new(aria: { label: "メッセージ履歴" })) do
                        render(Shadcn::MessageScroller::Content.new) do
                          render(Shadcn::MessageScroller::Item.new) { "最新のメッセージ" }
                        end
                      end,
                      render(Shadcn::MessageScroller::Button.new(aria: { label: "一番下へ移動" })) { "一番下へ" }
                    ])
        end
      end
    end
  end
end
