# frozen_string_literal: true

module Shadcn
  class NavigationMenuPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::NavigationMenu.new) do
        render(Shadcn::NavigationMenu::List.new) do
          render(Shadcn::NavigationMenu::Item.new) do
            render(Shadcn::NavigationMenu::Link.new(href: "#")) { "ホーム" }
          end
        end
      end
    end

    def with_trigger
      render(Shadcn::NavigationMenu.new) do
        render(Shadcn::NavigationMenu::List.new) do
          render(Shadcn::NavigationMenu::Item.new) do
            safe_join([
              render(Shadcn::NavigationMenu::Trigger.new) { "ドキュメント" },
              render(Shadcn::NavigationMenu::Content.new) do
                render(Shadcn::NavigationMenu::Link.new(href: "#")) { "はじめに" }
              end
            ])
          end
        end
      end
    end
  end
end
