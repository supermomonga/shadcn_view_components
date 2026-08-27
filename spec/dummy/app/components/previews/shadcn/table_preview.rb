# frozen_string_literal: true

module Shadcn
  class TablePreview < ViewComponent::Preview
    def default
      render(Shadcn::Table.new) do
        safe_join([
          render(Shadcn::Table::Header.new) do
            render(Shadcn::Table::Row.new) do
              safe_join([render(Shadcn::Table::Head.new) { "名前" }, render(Shadcn::Table::Head.new) { "値" }])
            end
          end,
          render(Shadcn::Table::Body.new) do
            safe_join([
              render(Shadcn::Table::Row.new) do
                safe_join([render(Shadcn::Table::Cell.new) { "項目A" }, render(Shadcn::Table::Cell.new) { "1" }])
              end,
              render(Shadcn::Table::Row.new) do
                safe_join([render(Shadcn::Table::Cell.new) { "項目B" }, render(Shadcn::Table::Cell.new) { "2" }])
              end
            ])
          end,
          render(Shadcn::Table::Caption.new) { "キャプション" }
        ])
      end
    end
  end
end
