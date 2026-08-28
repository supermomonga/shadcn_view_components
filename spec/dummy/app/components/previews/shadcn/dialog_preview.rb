# frozen_string_literal: true

module Shadcn
  class DialogPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Dialog.new) do
        safe_join([
          render(Shadcn::Dialog::Trigger.new(variant: :outline)) { "設定を開く" },
          render(Shadcn::Dialog::Content.new) do
            safe_join([
              render(Shadcn::Dialog::Header.new) do
                safe_join([
                  render(Shadcn::Dialog::Title.new) { "プロフィール編集" },
                  render(Shadcn::Dialog::Description.new) { "公開される情報です" }
                ])
              end,
              render(Shadcn::Dialog::Footer.new) do
                render(Shadcn::Dialog::Close.new) { "閉じる" }
              end
            ])
          end
        ])
      end
    end
  end
end
