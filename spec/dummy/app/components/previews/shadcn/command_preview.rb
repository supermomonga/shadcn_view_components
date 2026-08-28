# frozen_string_literal: true

module Shadcn
  class CommandPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Command.new(class: "rounded-lg border shadow-md")) do
        safe_join([
          render(Shadcn::Command::Input.new(placeholder: "コマンドを検索…")),
          render(Shadcn::Command::List.new) do
            safe_join([
              render(Shadcn::Command::Empty.new) { "結果が見つかりません" },
              render(Shadcn::Command::Group.new) do
                safe_join([
                  render(Shadcn::Command::Item.new(value: "copy")) do
                    safe_join(["コピー", render(Shadcn::Command::Shortcut.new) { "⌘C" }])
                  end,
                  render(Shadcn::Command::Item.new(value: "paste")) do
                    safe_join(["貼り付け", render(Shadcn::Command::Shortcut.new) { "⌘V" }])
                  end
                ])
              end
            ])
          end
        ])
      end
    end
  end
end
