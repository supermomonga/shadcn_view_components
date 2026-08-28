# typed: strict
# frozen_string_literal: true

module Shadcn
  # Railsフォーム統合層(10-roadmap Phase 2)。upstream は react-hook-form の
  # Controller/コンテキストで状態を配るが、Railsでは form_with のモデル検証と
  # ERB側での属性組み立てがその役割を担うため、ここは「表示構造の契約」のみ提供する:
  #
  #   <%= form_with model: user do |f| %>
  #     <%= render Shadcn::Form::Item.new do %>
  #       <%= render Shadcn::Form::Label.new(for: "user-email", error: user.errors[:email].any?) { "メールアドレス" } %>
  #       <%= render Shadcn::Form::Control.new do %> <%= render Shadcn::Input.new(id: "user-email",
  #             aria: { invalid: user.errors[:email].any? }) %> <% end %>
  #       <%= render Shadcn::Form::Message.new(message: user.errors[:email].full_message) %>
  #     <% end %>
  #   <% end %>
  #
  # JS無効時フォールバック: Graceful(表示は全てサーバ側で完結する)
  # aria-invalid / aria-describedby の紐付けは利用者(またはフォームビルダ拡張)が
  # 持つ — upstream の useFormField 相当の暗黙接続はRailsの流儀に無い
  class Form < BaseComponent
    # upstream の Form(=FormProvider)に対応する表示物は無い。
    # form_with を使うため、このコンポーネントは子をそのまま描くのみ
    sig { override.returns(String) }
    def call
      content
    end
  end

  class Form
    class Item < BaseComponent
      # upstream のJSXルートは Context.Provider ラッパー。実要素は form-item の div
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def contract_root_slot
        contract_slot("form-item")
      end
    end

    class Label < BaseComponent
      # for / data-error を受け取る(upstream の htmlFor / data-error={!!error})
      sig { params(error: T::Boolean, args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(error: false, **args)
        @error = error
        super(**args)
      end

      sig { override.returns(String) }
      def default_tag
        "label"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        merge_nested(attributes, :data, { error: @error.to_s })
        # upstream の FormLabel は <Label> を描く: ラベルの契約クラスを土台に
        # フォーム契約側の data-[error=true]:text-destructive を重ねる
        # (cn(labelVariants(), "data-[error=true]:...") と同じ順)
        attributes[:class] = ShadcnViewComponents::Classes.resolve(:label, extra: attributes[:class].to_s)
        attributes
      end
    end

    class Control < BaseComponent
      # upstream は Radix Slot(子要素に属性を合成)。ViewComponentでは子を文字列として
      # 受けるため合成できず、div ラッパーとして描く(文書化された構造差)
      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) { content }
      end
    end

    class Description < BaseComponent
      # p。id は利用者が aria-describedby 紐付けのために指定する
      sig { override.returns(String) }
      def default_tag
        "p"
      end
    end

    class Message < BaseComponent
      # p。upstream と同じく「本文が無ければ描かない」(検証エラーの有無で出し分ける)
      sig { params(message: T.nilable(String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(message: nil, **args)
        @message = message
        super(**args)
      end

      sig { override.returns(String) }
      def default_tag
        "p"
      end

      sig { override.returns(String) }
      def call
        body = @message || content
        return "" if body.nil? || body.to_s.empty?

        content_tag(tag, **html_attributes) { body.to_s }
      end
    end
  end
end
