# frozen_string_literal: true

module Shadcn
  class AccordionPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Accordion.new) do
        safe_join([
          accordion_item("1", "最初の項目", "内容その1"),
          accordion_item("2", "2番目の項目", "内容その2")
        ])
      end
    end

    private

    def accordion_item(name, title, body)
      render(Shadcn::Accordion::Item.new(name: "accordion")) do
        safe_join([
          render(Shadcn::Accordion::Trigger.new) { title },
          render(Shadcn::Accordion::Content.new) { body }
        ])
      end
    end
  end
end
