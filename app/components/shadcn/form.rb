# typed: strict
# frozen_string_literal: true

module Shadcn
  # Railsフォーム統合層。upstream(base-nova)は form アイテムを廃止し、公式 docs/forms
  # ガイドは Field プリミティブ + data-invalid / aria-invalid の手動ワイヤリングへ移行した
  # (Issue #3)。本gemもそれに倣い、Field の上に最小2部品で構成する:
  #
  #   <%= form_with model: user do |f| %>
  #     <%= render Shadcn::Form::Item.new(invalid: user.errors[:email].any?) do %>
  #       <%= render Shadcn::Field::Label.new(for: "user-email") { "メールアドレス" } %>
  #       <%= render Shadcn::Input.new(id: "user-email",
  #             aria: { invalid: user.errors[:email].any? }) %>
  #       <%= render Shadcn::Field::Description.new { "ログインに使うアドレスです" } %>
  #       <%= render Shadcn::Form::Error.new(errors: user.errors.full_messages_for(:email)) %>
  #     <% end %>
  #   <% end %>
  #
  # ラベル・説明には Shadcn::Field::Label / Shadcn::Field::Description を直接使う。
  # Form::Item は Field と同じ DOM 構造(data-slot="field")を描くため、Field 部品を
  # そのまま内側に置ける。JS無効時フォールバック: Graceful(表示は全てサーバ側で完結する)
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
    # upstream docs/forms の <Field data-invalid={...}> 相当。DOM構造・クラスは
    # Field 契約と同一(契約側で fieldVariants を事前解決済み)。
    # data-slot を "field" に保つのは Field 部品の group/field セレクタ互換のため
    class Item < BaseComponent
      sig do
        params(invalid: T::Boolean,
               orientation: T.any(Symbol, String),
               args: T::Hash[Symbol, T.untyped]).void.checked(:never)
      end
      def initialize(invalid: false, orientation: ShadcnViewComponents::Contracts::Form::Item::DEFAULTS.fetch(:orientation), **args)
        @invalid = invalid
        @orientation = T.let(normalize_option(:orientation, orientation), Symbol)
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { orientation: @orientation }
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        # upstream は boolean prop を常に "true"/"false" として出力する
        merge_nested(attributes, :data, { invalid: @invalid.to_s, orientation: @orientation.to_s })
        attributes
      end
    end

    # upstream の FieldError セマンティクス(upstream準拠、入力はRails流の文字列配列):
    # 本文 > errors(重複除去) の優先で、1件は平文・複数は ul リスト・無ければ非描画。
    # Rails では model.errors.full_messages_for(:attr) をそのまま渡せる
    class Error < BaseComponent
      sig do
        params(message: T.nilable(String),
               errors: T.nilable(T::Array[T.nilable(String)]),
               args: T::Hash[Symbol, T.untyped]).void.checked(:never)
      end
      def initialize(message: nil, errors: nil, **args)
        @message = message
        @errors = T.let(errors, T.nilable(T::Array[T.nilable(String)]))
        super(**args)
      end

      sig { override.returns(String) }
      def call
        body = content.to_s
        messages = unique_messages
        return "" if body.empty? && messages.empty?

        content_tag(tag, **html_attributes) do
          if body.present?
            body
          elsif messages.length == 1
            messages.first.to_s
          else
            error_list(messages)
          end
        end
      end

      private

      sig { returns(T::Array[String]) }
      def unique_messages
        ([@message].compact + (@errors || []).compact).uniq
      end

      # 複数件は ul リスト。リストのクラスは契約に記録済み
      # (upstream の ul は data-slot を持たないため、名前無しスロットとして契約化した)
      sig { params(messages: T::Array[String]).returns(String) }
      def error_list(messages)
        list_class = T.cast(contract_slot("").dig(:static_attributes, :class), T.nilable(String))
        content_tag(:ul, class: list_class, data: { slot: "form-error-list" }) do
          safe_join(messages.map { |message| content_tag(:li) { message.to_s } })
        end
      end
    end
  end
end
