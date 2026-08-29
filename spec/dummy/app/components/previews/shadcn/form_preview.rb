# frozen_string_literal: true

module Shadcn
  class FormPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Form::Item.new(invalid: true)) do
        safe_join([
                    render(Shadcn::Field::Label.new(for: "preview-email")) { "メールアドレス" },
                    render(Shadcn::Input.new(id: "preview-email", type: "email", placeholder: "you@example.com", aria: { invalid: true })),
                    render(Shadcn::Field::Description.new) { "ログインに使うアドレスです" },
                    render(Shadcn::Form::Error.new(errors: ["メールアドレスを入力してください"]))
                  ])
      end
    end

    def without_error
      render(Shadcn::Form::Item.new) do
        safe_join([
                    render(Shadcn::Field::Label.new(for: "preview-name")) { "名前" },
                    render(Shadcn::Input.new(id: "preview-name")),
                    render(Shadcn::Field::Description.new) { "エラーが無いときはError要素自体が描かれません" },
                    render(Shadcn::Form::Error.new)
                  ])
      end
    end
  end
end
