# frozen_string_literal: true

module Shadcn
  class BreadcrumbPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Breadcrumb.new) do
        render(Shadcn::Breadcrumb::List.new) do
          safe_join([
            render(Shadcn::Breadcrumb::Item.new) do
              render(Shadcn::Breadcrumb::Link.new(href: "#")) { "Home" }
            end,
            render(Shadcn::Breadcrumb::Separator.new),
            render(Shadcn::Breadcrumb::Item.new) do
              render(Shadcn::Breadcrumb::Link.new(href: "#")) { "記事" }
            end,
            render(Shadcn::Breadcrumb::Separator.new),
            render(Shadcn::Breadcrumb::Item.new) do
              render(Shadcn::Breadcrumb::Page.new) { "現在のページ" }
            end
          ])
        end
      end
    end

    def ellipsis
      render(Shadcn::Breadcrumb.new) do
        render(Shadcn::Breadcrumb::List.new) do
          safe_join([
            render(Shadcn::Breadcrumb::Item.new) { render(Shadcn::Breadcrumb::Link.new(href: "#")) { "Home" } },
            render(Shadcn::Breadcrumb::Item.new) { render(Shadcn::Breadcrumb::Ellipsis.new) },
            render(Shadcn::Breadcrumb::Item.new) { render(Shadcn::Breadcrumb::Page.new) { "現在" } }
          ])
        end
      end
    end
  end
end
