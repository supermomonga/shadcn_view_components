# frozen_string_literal: true

module Shadcn
  class PaginationPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Pagination.new) do
        render(Shadcn::Pagination::Content.new) do
          safe_join([
            render(Shadcn::Pagination::Item.new) { render(Shadcn::Pagination::Previous.new(href: "#")) },
            render(Shadcn::Pagination::Item.new) do
              render(Shadcn::Pagination::Link.new(href: "#")) { "1" }
            end,
            render(Shadcn::Pagination::Item.new) do
              render(Shadcn::Pagination::Link.new(href: "#", is_active: true)) { "2" }
            end,
            render(Shadcn::Pagination::Item.new) do
              render(Shadcn::Pagination::Link.new(href: "#")) { "3" }
            end,
            render(Shadcn::Pagination::Item.new) { render(Shadcn::Pagination::Ellipsis.new) },
            render(Shadcn::Pagination::Item.new) { render(Shadcn::Pagination::Next.new(href: "#")) }
          ])
        end
      end
    end
  end
end
