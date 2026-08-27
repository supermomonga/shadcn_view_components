# frozen_string_literal: true

module Shadcn
  class SheetPreview < ViewComponent::Preview
    def default
      render(Shadcn::Sheet.new) do
        safe_join([
          render(Shadcn::Sheet::Trigger.new(variant: :outline)) { "メニューを開く" },
          render(Shadcn::Sheet::Content.new) do
            safe_join([
              render(Shadcn::Sheet::Header.new) do
                safe_join([
                  render(Shadcn::Sheet::Title.new) { "設定" },
                  render(Shadcn::Sheet::Description.new) { "右からスライドインします" }
                ])
              end,
              render(Shadcn::Sheet::Footer.new) do
                render(Shadcn::Sheet::Close.new) { "閉じる" }
              end
            ])
          end
        ])
      end
    end
  end
end
