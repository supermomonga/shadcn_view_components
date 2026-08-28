# frozen_string_literal: true

module Shadcn
  class MenubarPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Menubar.new) do
        render(Shadcn::Menubar::Menu.new) do
          safe_join([
            render(Shadcn::Menubar::Trigger.new) { "ファイル" },
            render(Shadcn::Menubar::Content.new) do
              safe_join([
                render(Shadcn::Menubar::Item.new) { "新規作成" },
                render(Shadcn::Menubar::Item.new) do
                  safe_join(["保存", render(Shadcn::Menubar::Shortcut.new) { "⌘S" }])
                end,
                render(Shadcn::Menubar::Separator.new),
                render(Shadcn::Menubar::Item.new) { "終了" }
              ])
            end
          ])
        end
      end
    end
  end
end
