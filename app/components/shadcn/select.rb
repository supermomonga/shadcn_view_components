# typed: strict
# frozen_string_literal: true

module Shadcn
  # 単一選択のcombobox + listbox。確定値はルート直下のhidden inputだけに保持し、
  # 表示値・選択ARIA・ハイライトは専用Stimulus controllerがそこから導出する。
  # JS不要、multiple、ネイティブ制約検証が必要な場合はNativeSelectを使う。
  class Select < BaseComponent
    CONTROLLER = "shadcn--select"

    sig do
      params(
        name: T.nilable(T.any(String, Symbol)),
        default_value: T.nilable(T.any(String, Symbol, Integer, Float)),
        disabled: T::Boolean,
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(name: nil, default_value: nil, disabled: false, **args)
      @name = T.let(name&.to_s, T.nilable(String))
      @default_value = T.let(default_value&.to_s, T.nilable(String))
      @disabled = T.let(disabled, T::Boolean)
      super(**args)
    end

    # base-novaのSelect rootはDOMやclassを追加しないprimitive aliasで、生成契約も
    # その空の契約面を記録する。Ruby側ではhidden inputとcontrollerの状態ホストを描く。
    sig { override.returns(String) }
    def call
      content_tag(tag, **html_attributes) { safe_join([hidden_input, content]) }
    end

    private

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = super
      data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
      defaults = {
        slot: "select",
        controller: CONTROLLER,
        action: "keydown->#{CONTROLLER}#navigate focusout->#{CONTROLLER}#focusOut"
      }
      defaults[:disabled] = "true" if @disabled
      attributes[:data] = defaults.merge(data)
      attributes
    end

    sig { returns(String) }
    def hidden_input
      attributes = T.let(
        {
          type: "hidden",
          value: @default_value.to_s,
          data: {
            slot: "select-input",
            value_present: (!@default_value.nil?).to_s
          }
        },
        T::Hash[Symbol, T.untyped]
      )
      attributes[:name] = @name if @name
      attributes[:disabled] = true if @disabled
      void_tag("input", **attributes)
    end

    class Trigger < BaseComponent
      sig { params(size: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(size: self.class.property_default(:size), **args)
        @size = T.let(normalize_property(:size, size), String)
        super(**args)
      end

      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) { safe_join([content, chevron_icon]) }
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:type] = "button" unless attributes.key?(:type)
        attributes[:role] = "combobox"
        merge_nested(attributes, :aria, { haspopup: "listbox", expanded: "false" })
        merge_nested(attributes, :data, { size: @size, action: "click->#{CONTROLLER}#toggle" })
        attributes
      end

      private

      sig { returns(String) }
      def chevron_icon
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          class: "pointer-events-none size-4 text-muted-foreground",
          aria: { hidden: "true" }
        ) { raw(%(<path d="m6 9 6 6 6-6"/>)) }
      end
    end

    class Value < BaseComponent
      sig { params(placeholder: T.nilable(String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(placeholder: nil, **args)
        @placeholder = T.let(placeholder, T.nilable(String))
        super(**args)
      end

      sig { override.returns(String) }
      def call
        label = content.to_s
        label = @placeholder.to_s if label.empty?
        content_tag(tag, **html_attributes) { label }
      end
    end

    class Content < BaseComponent
      include Shadcn::FloatingPositionOptions

      FLOATING_POSITION_DEFAULTS = T.let(
        { side: :bottom, align: :center, side_offset: 4, align_offset: 0, collision_padding: 5 }.freeze,
        T::Hash[Symbol, T.untyped]
      )

      # Positioner相当のラッパー > Popup > Listというupstream構造を保つ。
      sig { override.returns(String) }
      def call
        content_tag(:div, class: "isolate z-50") do
          content_tag(tag, **content_attributes) do
            safe_join([
                        render(ScrollUpButton.new),
                        content_tag(
                          :div,
                          role: "listbox",
                          tabindex: "-1",
                          style: "position: relative; min-height: 0; flex: 1 1 auto; overflow-x: hidden; overflow-y: auto"
                        ) { content },
                        render(ScrollDownButton.new)
                      ])
          end
        end
      end

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def content_attributes
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
        attributes[:role] = "presentation" unless attributes.key?(:role)
        attributes[:popover] = "auto" unless attributes.key?(:popover)
        merge_style(attributes, display: "flex", flex_direction: "column", overflow: "hidden")
        merge_floating_position_data(
          attributes,
          slot: "select-content",
          state: "closed",
          closed: "",
          align_trigger: "true"
        )
      end
    end

    class Group < BaseComponent
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.merge(role: "group")
      end
    end

    class Item < BaseComponent
      sig do
        params(
          value: T.any(String, Symbol, Integer, Float),
          disabled: T::Boolean,
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(value:, disabled: false, **args)
        @value = T.let(value.to_s, String)
        @disabled = T.let(disabled, T::Boolean)
        super(**args)
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([item_text, item_indicator])
        end
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "option"
        attributes[:tabindex] = "-1"
        merge_nested(attributes, :aria, { selected: "false" }.merge(@disabled ? { disabled: "true" } : {}))
        item_data = {
          value: @value,
          selected: "false",
          action: "click->#{CONTROLLER}#select mouseenter->#{CONTROLLER}#highlight"
        }
        item_data[:disabled] = "" if @disabled
        merge_nested(attributes, :data, item_data)
        attributes
      end

      private

      sig { returns(String) }
      def item_text
        content_tag(:span, class: "flex flex-1 shrink-0 gap-2 whitespace-nowrap") { content }
      end

      sig { returns(String) }
      def item_indicator
        content_tag(
          :span,
          hidden: true,
          class: "pointer-events-none absolute right-2 flex size-4 items-center justify-center",
          data: { indicator: "" }
        ) { check_icon }
      end

      sig { returns(String) }
      def check_icon
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          class: "pointer-events-none",
          aria: { hidden: "true" }
        ) { raw(%(<path d="M20 6 9 17l-5-5"/>)) }
      end
    end

    class Label < BaseComponent
      # div
    end

    class Separator < BaseComponent
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.merge(role: "separator")
      end
    end

    module ChevronIcon
      extend T::Helpers
      extend T::Sig

      requires_ancestor { BaseComponent }

      private

      sig { params(path: String).returns(String) }
      def chevron_icon(path)
        T.unsafe(self).content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          aria: { hidden: "true" }
        ) { T.unsafe(self).raw(%(<path d="#{path}"/>)) }
      end
    end
    private_constant :ChevronIcon

    class ScrollUpButton < BaseComponent
      include ChevronIcon

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) { content.presence || chevron_icon("m18 15-6-6-6 6") }
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        scroll_button_attributes(super, "up")
      end

      private

      sig do
        params(attributes: T::Hash[Symbol, T.untyped], direction: String)
          .returns(T::Hash[Symbol, T.untyped])
      end
      def scroll_button_attributes(attributes, direction)
        attributes[:hidden] = true
        merge_nested(attributes, :aria, { hidden: "true" })
        merge_nested(
          attributes,
          :data,
          {
            scroll_direction: direction,
            action: "mouseenter->#{CONTROLLER}#startScroll mouseleave->#{CONTROLLER}#stopScroll"
          }
        )
        merge_style(attributes, position: "absolute")
        attributes
      end
    end

    class ScrollDownButton < BaseComponent
      include ChevronIcon

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) { content.presence || chevron_icon("m6 9 6 6 6-6") }
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        scroll_button_attributes(super, "down")
      end

      private

      sig do
        params(attributes: T::Hash[Symbol, T.untyped], direction: String)
          .returns(T::Hash[Symbol, T.untyped])
      end
      def scroll_button_attributes(attributes, direction)
        attributes[:hidden] = true
        merge_nested(attributes, :aria, { hidden: "true" })
        merge_nested(
          attributes,
          :data,
          {
            scroll_direction: direction,
            action: "mouseenter->#{CONTROLLER}#startScroll mouseleave->#{CONTROLLER}#stopScroll"
          }
        )
        merge_style(attributes, position: "absolute")
        attributes
      end
    end
  end
end
