# frozen_string_literal: true

module Shadcn
  class CollapsiblePreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Collapsible.new) do
        safe_join([
          render(Shadcn::Collapsible::Trigger.new) { "開く/閉じる" },
          render(Shadcn::Collapsible::Content.new) { "折りたたまれる内容" }
        ])
      end
    end
  end
end
