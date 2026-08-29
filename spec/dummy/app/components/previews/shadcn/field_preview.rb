# frozen_string_literal: true

module Shadcn
  class FieldPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Field::Group.new) do
        safe_join([email_field, name_field])
      end
    end

    def horizontal
      render(Shadcn::Field.new(orientation: :horizontal)) do
        safe_join([publish_content, render(Shadcn::Switch.new)])
      end
    end

    private

    def email_field
      render(Shadcn::Field.new) do
        safe_join([
                    render(Shadcn::Field::Label.new(for: "field-email")) { "メールアドレス" },
                    render(Shadcn::Input.new(id: "field-email", type: "email", placeholder: "you@example.com")),
                    render(Shadcn::Field::Description.new) { "ログインに使うアドレスです" }
                  ])
      end
    end

    def name_field
      render(Shadcn::Field.new) do
        safe_join([
                    render(Shadcn::Field::Label.new(for: "field-name")) { "名前" },
                    render(Shadcn::Input.new(id: "field-name")),
                    render(Shadcn::Field::Description.new) { "表示名として使われます" }
                  ])
      end
    end

    def publish_content
      render(Shadcn::Field::Content.new) do
        safe_join([
                    render(Shadcn::Field::Title.new) { "公開する" },
                    render(Shadcn::Field::Description.new) { "プロフィールを全員に表示します" }
                  ])
      end
    end
  end
end
