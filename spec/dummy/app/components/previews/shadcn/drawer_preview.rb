# frozen_string_literal: true

module Shadcn
  class DrawerPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Drawer.new) do
        safe_join([
          render(Shadcn::Drawer::Trigger.new(variant: :outline)) { "ドロワーを開く" },
          render(Shadcn::Drawer::Content.new) do
            safe_join([
              render(Shadcn::Drawer::Header.new) do
                safe_join([
                  render(Shadcn::Drawer::Title.new) { "お知らせ" },
                  render(Shadcn::Drawer::Description.new) { "下部からスライドインします" }
                ])
              end,
              render(Shadcn::Drawer::Footer.new) do
                render(Shadcn::Drawer::Close.new) { "閉じる" }
              end
            ])
          end
        ])
      end
    end
  end
end
