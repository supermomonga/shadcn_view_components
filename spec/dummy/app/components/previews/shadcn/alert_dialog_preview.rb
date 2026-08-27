# frozen_string_literal: true

module Shadcn
  class AlertDialogPreview < ViewComponent::Preview
    def default
      render(Shadcn::AlertDialog.new) do
        safe_join([
          render(Shadcn::AlertDialog::Trigger.new(variant: :destructive)) { "アカウント削除" },
          render(Shadcn::AlertDialog::Content.new) do
            safe_join([
              render(Shadcn::AlertDialog::Header.new) do
                safe_join([
                  render(Shadcn::AlertDialog::Title.new) { "本当に削除しますか?" },
                  render(Shadcn::AlertDialog::Description.new) do
                    "この操作は取り消せません。データが完全に削除されます。"
                  end
                ])
              end,
              render(Shadcn::AlertDialog::Footer.new) do
                safe_join([
                  render(Shadcn::AlertDialog::Cancel.new) { "キャンセル" },
                  render(Shadcn::AlertDialog::Action.new(variant: :destructive)) { "削除する" }
                ])
              end
            ])
          end
        ])
      end
    end
  end
end
