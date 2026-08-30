# typed: strict
# frozen_string_literal: true

module Shadcn
  # 実inputを値・selection・フォーム送信の唯一の情報源にし、Slot群はその派生表示とする。
  # inputMode=numericはソフトウェアキーボードへのhintであり、入力制限は利用者指定patternが担う。
  class InputOTP < BaseComponent
    CONTROLLER = "shadcn--input-otp"

    module Markup
      CONTAINER_CLASS = "cn-input-otp flex items-center has-disabled:opacity-50"
      CONTAINER_STYLE = "position: relative; cursor: %<cursor>s; user-select: none; " \
                        "-webkit-user-select: none; pointer-events: none"
      DISPLAY_STYLE = "display: contents"
      INPUT_ACTION = T.let([
        "input->#{InputOTP::CONTROLLER}#sync",
        "change->#{InputOTP::CONTROLLER}#sync",
        "focus->#{InputOTP::CONTROLLER}#sync",
        "blur->#{InputOTP::CONTROLLER}#sync",
        "select->#{InputOTP::CONTROLLER}#sync",
        "invalid->#{InputOTP::CONTROLLER}#sync",
        "compositionstart->#{InputOTP::CONTROLLER}#compositionStart",
        "compositionend->#{InputOTP::CONTROLLER}#compositionEnd"
      ].join(" ").freeze, String)
      INPUT_STYLE = T.let({
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        text_align: "left",
        opacity: 1,
        color: "transparent",
        pointer_events: "all",
        background: "transparent",
        caret_color: "transparent",
        border: "0 solid transparent",
        outline: "0 solid transparent",
        box_shadow: "none",
        line_height: 1,
        letter_spacing: "-.5em",
        font_size: "var(--root-height, 16px)",
        font_family: "monospace",
        font_variant_numeric: "tabular-nums"
      }.freeze, T::Hash[Symbol, T.untyped])
      INPUT_OVERLAY_STYLE = "position: absolute; inset: 0; pointer-events: none"
      NOSCRIPT_CSS_FALLBACK = <<~CSS
        [data-input-otp] {
          --nojs-bg: white !important;
          --nojs-fg: black !important;

          background-color: var(--nojs-bg) !important;
          color: var(--nojs-fg) !important;
          caret-color: var(--nojs-fg) !important;
          letter-spacing: .25em !important;
          text-align: center !important;
          border: 1px solid var(--nojs-fg) !important;
          border-radius: 4px !important;
          width: 100% !important;
        }
        @media (prefers-color-scheme: dark) {
          [data-input-otp] {
            --nojs-bg: black !important;
            --nojs-fg: white !important;
          }
        }
      CSS
    end

    private_constant :Markup

    sig do
      params(
        length: T.any(Integer, String),
        value: T.nilable(String),
        container_class: T.nilable(String),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(length: self.class.property_default(:length), value: nil, container_class: nil, **args)
      @length = T.let(normalize_property(:length, length), Integer)
      @value = T.let(value&.slice(0, @length), T.nilable(String))
      @container_class = T.let(container_class, T.nilable(String))
      super(**args)
    end

    sig { override.returns(String) }
    def call
      safe_join([noscript_fallback, input_container])
    end

    private

    sig { returns(String) }
    def input_container
      content_tag(
        :div,
        class: container_class,
        style: format(Markup::CONTAINER_STYLE, cursor: disabled? ? "default" : "text"),
        data: { controller: CONTROLLER, input_otp_container: "" }
      ) do
        safe_join([decorative_display, input_overlay])
      end
    end

    sig { returns(String) }
    def decorative_display
      data = T.let({ input_otp_display: "" }, T::Hash[Symbol, T.untyped])
      data[:disabled] = "" if disabled?
      data[:invalid] = "" if invalid?

      content_tag(:div, style: Markup::DISPLAY_STYLE, aria: { hidden: "true" }, data:) do
        content? ? content : standard_group
      end
    end

    sig { returns(String) }
    def standard_group
      render(Group.new) do
        safe_join(Array.new(@length) { |index| standard_slot(index) })
      end
    end

    sig { params(index: Integer).returns(String) }
    def standard_slot(index)
      data = T.let({}, T::Hash[Symbol, T.untyped])
      data[:disabled] = "" if disabled?

      render(Slot.new(index:, data:, aria: { invalid: invalid?.to_s })) do
        @value.to_s[index].to_s
      end
    end

    sig { returns(String) }
    def input_overlay
      content_tag(:div, style: Markup::INPUT_OVERLAY_STYLE) { input_element }
    end

    sig { returns(String) }
    def input_element
      attributes = html_attributes
      attributes[:type] = "text"
      attributes[:inputmode] = "numeric" unless attributes.key?(:inputmode)
      attributes[:maxlength] = @length
      attributes[:autocomplete] = "one-time-code" unless attributes.key?(:autocomplete)
      attributes[:spellcheck] = false unless attributes.key?(:spellcheck)
      attributes[:value] = @value unless @value.nil?
      merge_style(attributes, Markup::INPUT_STYLE)
      merge_input_data(attributes)
      void_tag("input", **attributes)
    end

    sig { params(attributes: T::Hash[Symbol, T.untyped]).void }
    def merge_input_data(attributes)
      data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
      user_action = data[:action]
      attributes[:data] = data.merge(
        input_otp: "",
        action: [Markup::INPUT_ACTION, user_action].compact.join(" ")
      )
    end

    sig { returns(String) }
    def noscript_fallback
      content_tag(:noscript) do
        content_tag(:style) { raw(Markup::NOSCRIPT_CSS_FALLBACK) }
      end
    end

    sig { returns(String) }
    def container_class
      ShadcnViewComponents::Classes::MERGER.merge(
        [Markup::CONTAINER_CLASS, @container_class].compact.join(" ")
      )
    end

    sig { returns(T::Boolean) }
    def disabled?
      !@html_args[:disabled].nil? && @html_args[:disabled] != false
    end

    sig { returns(T::Boolean) }
    def invalid?
      aria = T.cast(@html_args[:aria], T.nilable(T::Hash[Symbol, T.untyped])) || {}
      aria[:invalid] == true || aria[:invalid].to_s == "true"
    end

    class Group < BaseComponent
      # div
    end

    class Slot < BaseComponent
      CARET_WRAPPER_CLASS = "pointer-events-none absolute inset-0 flex items-center justify-center"
      CARET_CLASS = "h-4 w-px animate-caret-blink bg-foreground duration-1000"

      private_constant :CARET_WRAPPER_CLASS, :CARET_CLASS

      sig { params(index: T.any(Integer, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(index:, **args)
        @index = T.let(normalize_property(:index, index), Integer)
        super(**args)
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([character, fake_caret])
        end
      end

      private

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.tap do |attributes|
          data = T.cast(attributes[:data], T::Hash[Symbol, T.untyped])
          data[:index] = @index
          data[:active] = "false" unless data.key?(:active)
        end
      end

      sig { returns(String) }
      def character
        content_tag(:span, data: { slot: "input-otp-character" }) { content }
      end

      sig { returns(String) }
      def fake_caret
        content_tag(
          :div,
          class: CARET_WRAPPER_CLASS,
          hidden: true,
          aria: { hidden: "true" },
          data: { slot: "input-otp-caret" }
        ) do
          content_tag(:div, class: CARET_CLASS) { "".html_safe }
        end
      end
    end

    class Separator < BaseComponent
      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) { minus_icon }
      end

      private

      sig { returns(String) }
      def minus_icon
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          aria: { hidden: "true" }
        ) { raw(%(<path d="M5 12h14"/>)) }
      end
    end
  end
end
