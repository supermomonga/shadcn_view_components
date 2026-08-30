# typed: strict
# frozen_string_literal: true

module Shadcn
  # スライドインパネル(ネイティブ <dialog> + スライド変形 — 10-roadmap Phase 3)。
  # JS無効時フォールバック: Readable(dialog と同じ)
  class Sheet < BaseComponent
    CONTROLLER = "shadcn--dialog"

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(controller: CONTROLLER)
    end

    class Trigger < BaseComponent
      include Shadcn::ButtonStyled

      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = apply_button_styling(super)
        attributes[:type] = "button" unless attributes.key?(:type)
        merge_nested(attributes, :aria, { haspopup: "dialog", expanded: "false" })
        merge_nested(attributes, :data, { action: "#{CONTROLLER}#show" })
        attributes
      end
    end

    class Close < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:type] = "button" unless attributes.key?(:type)
        merge_nested(attributes, :data, { action: "#{CONTROLLER}#close" })
        attributes
      end
    end

    class Content < BaseComponent
      # side は base-nova では契約propではなく data-side 属性(クラスは
      # data-[side=...]: のCSS variantで追従する)。4枝のクラスは契約に統合済み
      sig do
        params(
          side: T.any(Symbol, String),
          show_close_button: T::Boolean,
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(side: self.class.property_default(:side), show_close_button: true, **args)
        @side = T.let(normalize_property(:side, side), String)
        @show_close_button = show_close_button
        super(**args)
      end

      sig { override.returns(String) }
      def call
        content_tag(:dialog, **content_attributes) do
          safe_join([content.presence, close_button].compact)
        end
      end

      private

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def content_attributes
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { slot: "sheet-content", side: @side }.merge(data)
        aria = T.cast(attributes[:aria], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:aria] = { modal: "true" }.merge(aria)
        attributes
      end

      # upstream のクローズボタン(render prop のButton variant="ghost" size="icon-sm"
      # + absolute配置)。契約クラスはButton契約から合成する
      sig { returns(T.nilable(String)) }
      def close_button
        return nil unless @show_close_button

        content_tag(
          :button,
          type: "button",
          class: close_class,
          data: { slot: "sheet-close", action: "#{CONTROLLER}#close" },
          aria: { label: "Close" }
        ) do
          safe_join([close_icon, content_tag(:span, class: "sr-only") { "Close" }])
        end
      end

      sig { returns(String) }
      def close_class
        # NOTE: Hashの値型は不変のため、Classes.resolve の options と同じ型で T.let する
        button_options = T.let({ variant: :ghost, size: :"icon-sm" },
                               T::Hash[Symbol, T.nilable(T.any(Symbol, String))])
        ShadcnViewComponents::Classes.resolve(:button, extra: "absolute top-3 right-3", **button_options)
      end

      sig { returns(String) }
      def close_icon
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          width: "16",
          height: "16",
          class: "size-4",
          aria: { hidden: "true" }
        ) do
          raw(%(<path d="M18 6 6 18"/><path d="m6 6 12 12"/>))
        end
      end
    end

    class Header < BaseComponent
      # div
    end

    class Footer < BaseComponent
      # div
    end

    class Title < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "h2"
      end
    end

    class Description < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "p"
      end
    end
  end
end
