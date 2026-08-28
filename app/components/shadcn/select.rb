# typed: strict
# frozen_string_literal: true

module Shadcn
  # セレクトボックス(menu_controller + Popover API の listbox で再実装)。
  # 値の送出には Trigger の name 属性で隠しinputを描く(利用者が指定する)
  # JS無効時フォールバック: Readable(選択肢はSSR済み)
  class Select < BaseComponent
    CONTROLLER = "shadcn--menu"

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
        attributes[:role] = "combobox"
        merge_nested(attributes, :aria, { haspopup: "listbox", expanded: "false" })
        merge_nested(attributes, :data, { action: "#{CONTROLLER}#toggle" })
        attributes
      end
    end

    class Value < BaseComponent
      # span(Trigger の内側に置く表示用)
    end

    class Content < BaseComponent
      # 契約スロット構成: 名前無しラッパー(portal相当) > select-content。
      # position は enum ガード(position === "popper" && ...)の露出prop
      sig do
        params(position: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never)
      end
      def initialize(position: ShadcnViewComponents::Contracts::Select::Content::DEFAULTS.fetch(:position), **args)
        @position = T.let(normalize_option(:position, position), Symbol)
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { position: @position }
      end

      sig { override.returns(String) }
      def call
        content_tag(:div, class: wrapper_class) do
          content_tag(tag, **content_attributes) { content }
        end
      end

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def content_attributes
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class, **variant_options))
        attributes[:role] = "listbox"
        attributes[:popover] = "auto"
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { slot: "select-content", state: "closed" }.merge(data)
        attributes
      end

      private

      sig { returns(T.nilable(String)) }
      def wrapper_class
        T.cast(contract_slot("").dig(:static_attributes, :class), T.nilable(String))
      end
    end

    class Group < BaseComponent
      # div
    end

    class Item < BaseComponent
      # 契約スロット構成: select-item + select-item-indicator
      sig { params(value: T.nilable(String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(value: nil, **args)
        @value = value
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "option"
        attributes[:tabindex] = "-1"
        merge_nested(attributes, :data, { value: @value }.compact)
        attributes
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([content, indicator])
        end
      end

      private

      sig { returns(String) }
      def indicator
        content_tag(:span, class: indicator_class, data: { slot: "select-item-indicator" }) do
          content_tag(
            :svg,
            xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none",
            stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round",
            width: "14", height: "14", class: "size-4"
          ) { raw(%(<path d="M20 6 9 17l-5-5"/>)) }
        end
      end

      sig { returns(T.nilable(String)) }
      def indicator_class
        T.cast(contract_slot("select-item-indicator").dig(:static_attributes, :class), T.nilable(String))
      end
    end

    class Label < BaseComponent
      # div
    end

    class Separator < BaseComponent
      # div
    end

    class ScrollUpButton < BaseComponent
      # div(装飾。スクロールは本体のoverflowに任せる)
    end

    class ScrollDownButton < BaseComponent
      # div
    end
  end
end
