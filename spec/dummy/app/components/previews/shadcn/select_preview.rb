# frozen_string_literal: true

module Shadcn
  class SelectPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Select.new(default_value: "apple")) do
        safe_join([select_trigger, select_content])
      end
    end

    private

    def select_trigger
      render(Shadcn::Select::Trigger.new) do
        render(Shadcn::Select::Value.new(placeholder: "果物を選択"))
      end
    end

    def select_content
      render(Shadcn::Select::Content.new) do
        render(Shadcn::Select::Group.new) { select_items }
      end
    end

    def select_items
      safe_join(
        [
          render(Shadcn::Select::Label.new) { "果物" },
          render(Shadcn::Select::Item.new(value: "apple")) { "りんご" },
          render(Shadcn::Select::Item.new(value: "banana")) { "バナナ" },
          render(Shadcn::Select::Separator.new),
          render(Shadcn::Select::Item.new(value: "orange")) { "オレンジ" }
        ]
      )
    end
  end
end
