# frozen_string_literal: true

module Shadcn
  class SidebarPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Sidebar::Provider.new) do
        safe_join([
                    render(Shadcn::Sidebar::Trigger.new),
                    render(Shadcn::Sidebar.new(aria: { label: "メインナビゲーション" })) do
                      render(Shadcn::Sidebar::Content.new) do
                        render(Shadcn::Sidebar::Menu.new) do
                          render(Shadcn::Sidebar::MenuItem.new) do
                            render(Shadcn::Sidebar::MenuButton.new) { "ホーム" }
                          end
                        end
                      end
                    end
                  ])
      end
    end
  end
end
