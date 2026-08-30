# frozen_string_literal: true

module Shadcn
  class AlertDialogPreview < Shadcn::PreviewBase
    def default
      render_alert_dialog(
        trigger: { text: "アカウント削除", variant: :destructive },
        title: "本当に削除しますか?",
        description: "この操作は取り消せません。データが完全に削除されます。",
        action: { text: "削除する", variant: :destructive }
      )
    end

    def accessibility
      render_alert_dialog(
        trigger: { text: "変更を確認", variant: :outline },
        title: "変更を保存しますか?",
        description: "保存すると変更内容が反映されます。",
        action: { text: "保存する", variant: :default }
      )
    end

    private

    def render_alert_dialog(trigger:, title:, description:, action:)
      render(Shadcn::AlertDialog.new) do
        safe_join([
                    alert_dialog_trigger(**trigger),
                    alert_dialog_content(title:, description:, action:)
                  ])
      end
    end

    def alert_dialog_trigger(text:, variant:)
      render(Shadcn::AlertDialog::Trigger.new(variant:)) { text }
    end

    def alert_dialog_content(title:, description:, action:)
      render(Shadcn::AlertDialog::Content.new) do
        safe_join([
                    alert_dialog_header(title, description),
                    alert_dialog_footer(**action)
                  ])
      end
    end

    def alert_dialog_header(title, description)
      render(Shadcn::AlertDialog::Header.new) do
        safe_join([
                    render(Shadcn::AlertDialog::Title.new) { title },
                    render(Shadcn::AlertDialog::Description.new) { description }
                  ])
      end
    end

    def alert_dialog_footer(text:, variant:)
      render(Shadcn::AlertDialog::Footer.new) do
        safe_join([
                    render(Shadcn::AlertDialog::Cancel.new) { "キャンセル" },
                    render(Shadcn::AlertDialog::Action.new(variant:)) { text }
                  ])
      end
    end
  end
end
