# frozen_string_literal: true

module Shadcn
  class FormPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Form::Item.new) do
        safe_join([
          render(Shadcn::Form::Label.new(for: "preview-email")) { "メールアドレス" },
          render(Shadcn::Form::Control.new) do
            render(Shadcn::Input.new(id: "preview-email", type: "email", placeholder: "you@example.com"))
          end,
          render(Shadcn::Form::Description.new) { "ログインに使うアドレスです" },
          render(Shadcn::Form::Message.new(message: "メールアドレスを入力してください"))
        ])
      end
    end

    def without_message
      render(Shadcn::Form::Item.new) do
        safe_join([
          render(Shadcn::Form::Label.new(for: "preview-name")) { "名前" },
          render(Shadcn::Form::Control.new) { render(Shadcn::Input.new(id: "preview-name")) },
          render(Shadcn::Form::Description.new) { "エラーが無いときはメッセージ要素自体が描かれません" }
        ])
      end
    end
  end
end
