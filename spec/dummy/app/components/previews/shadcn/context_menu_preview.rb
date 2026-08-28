# frozen_string_literal: true

module Shadcn
  class ContextMenuPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::ContextMenu.new) do
        safe_join([
          render(Shadcn::ContextMenu::Trigger.new(class: "rounded-md border p-8", style: "display: inline-block")) do
            "ここを右クリック"
          end,
          render(Shadcn::ContextMenu::Content.new) do
            safe_join([
              render(Shadcn::ContextMenu::Item.new) { "開く" },
              render(Shadcn::ContextMenu::Item.new) { "名前を変更" },
              render(Shadcn::ContextMenu::Separator.new),
              render(Shadcn::ContextMenu::Item.new) { "削除" }
            ])
          end
        ])
      end
    end
  end
end
