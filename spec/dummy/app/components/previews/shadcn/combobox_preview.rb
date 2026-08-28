# frozen_string_literal: true

module Shadcn
  class ComboboxPreview < ViewComponent::Preview
    def default
      render(Shadcn::Combobox.new) do
        safe_join([
          render(Shadcn::Combobox::Input.new(placeholder: "フレームワークを検索…")),
          render(Shadcn::Combobox::Content.new) do
            render(Shadcn::Combobox::List.new) do
              safe_join([
                render(Shadcn::Combobox::Empty.new) { "見つかりません" },
                render(Shadcn::Combobox::Item.new(value: "rails", selected: true)) { "Ruby on Rails" },
                render(Shadcn::Combobox::Item.new(value: "hanami")) { "Hanami" },
                render(Shadcn::Combobox::Item.new(value: "sinatra")) { "Sinatra" }
              ])
            end
          end
        ])
      end
    end

    def chips
      render(Shadcn::Combobox::Chips.new) do
        safe_join([
          render(Shadcn::Combobox::Chip.new) { "Rails" },
          render(Shadcn::Combobox::Chip.new) { "Hanami" },
          render(Shadcn::Combobox::ChipsInput.new(placeholder: "追加…"))
        ])
      end
    end
  end
end
