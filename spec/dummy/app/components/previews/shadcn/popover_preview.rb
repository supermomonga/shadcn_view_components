# frozen_string_literal: true

module Shadcn
  class PopoverPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Popover.new) do
        safe_join([
          render(Shadcn::Popover::Trigger.new(variant: :outline)) { "開く" },
          render(Shadcn::Popover::Content.new) do
            safe_join([
              render(Shadcn::Popover::Header.new) do
                safe_join([
                  render(Shadcn::Popover::Title.new) { "寸法" },
                  render(Shadcn::Popover::Description.new) { "ポップオーバーの内容です" }
                ])
              end
            ])
          end
        ])
      end
    end
  end
end
