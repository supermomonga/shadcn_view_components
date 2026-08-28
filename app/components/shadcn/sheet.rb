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
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
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
      # side は enum ガード(side === "right" && "...")を露出prop化した契約を持つ。
      # 4枝すべてのクラスが組み合わせとして事前解決済み
      sig do
        params(
          side: T.any(Symbol, String),
          show_close_button: T::Boolean,
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(side: ShadcnViewComponents::Contracts::Sheet::Content::DEFAULTS.fetch(:side),
                     show_close_button: true, **args)
        @side = T.let(normalize_option(:side, side), Symbol)
        @show_close_button = show_close_button
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { side: @side }
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
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class, **variant_options))
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { slot: "sheet-content", state: "closed" }.merge(data)
        aria = T.cast(attributes[:aria], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:aria] = { modal: "true" }.merge(aria)
        attributes
      end

      # upstream のクローズボタン(data-slot を持たないため契約スロット外。
      # 静的クラスは Content のJSXに直接書かれたもの)
      sig { returns(T.nilable(String)) }
      def close_button
        return nil unless @show_close_button

        content_tag(
          :button,
          type: "button",
          class: "absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity " \
                 "hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden " \
                 "disabled:pointer-events-none data-[state=open]:bg-secondary",
          data: { action: "#{CONTROLLER}#close" },
          aria: { label: "Close" }
        ) do
          safe_join([close_icon, content_tag(:span, class: "sr-only") { "Close" }])
        end
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
