# frozen_string_literal: true

module Shadcn
  class DropdownMenuPreview < ViewComponent::Preview
    def default
      render(Shadcn::DropdownMenu.new) do
        safe_join([
          render(Shadcn::DropdownMenu::Trigger.new(variant: :outline)) { "メニューを開く" },
          render(Shadcn::DropdownMenu::Content.new) do
            safe_join([
              render(Shadcn::DropdownMenu::Label.new) { "操作" },
              render(Shadcn::DropdownMenu::Item.new) { "コピー" },
              render(Shadcn::DropdownMenu::Item.new) do
                safe_join(["貼り付け", render(Shadcn::DropdownMenu::Shortcut.new) { "⌘V" }])
              end,
              render(Shadcn::DropdownMenu::Separator.new),
              render(Shadcn::DropdownMenu::CheckboxItem.new(checked: true)) { "通知を受け取る" },
              render(Shadcn::DropdownMenu::RadioGroup.new) do
                render(Shadcn::DropdownMenu::RadioItem.new(checked: true)) { "簡易表示" }
              end
            ])
          end
        ])
      end
    end
  end
end
