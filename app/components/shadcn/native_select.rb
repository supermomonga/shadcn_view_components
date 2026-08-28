# typed: strict
# frozen_string_literal: true

module Shadcn
  # 素の select/optgroup/option(JSレス — 05 §3)。ラッパーdiv + select + chevron
  class NativeSelect < BaseComponent
    sig { override.returns(String) }
    def call
      content_tag(:div, **html_attributes) do
        safe_join([select_element, chevron_icon])
      end
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = @html_args.merge(class: wrapper_class)
      attributes[:data] = { slot: "native-select-wrapper" }
      attributes
    end

    private

    # 選択肢は OptGroup / Option コンポーネントで content に渡す
    sig { returns(String) }
    def select_element
      content_tag(:select, class: self.class.classes, data: { slot: "native-select" }) { content }
    end

    sig { returns(T.nilable(String)) }
    def wrapper_class
      T.cast(contract_slot("native-select-wrapper").dig(:static_attributes, :class), T.nilable(String))
    end

    sig { returns(String) }
    def chevron_icon
      content_tag(
        :svg,
        xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none",
        stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round",
        width: "16", height: "16",
        class: T.cast(contract_slot("native-select-icon").dig(:static_attributes, :class), T.nilable(String)),
        aria: { hidden: "true" }, data: { slot: "native-select-icon" }
      ) { raw(%(<path d="m6 9 6 6 6-6"/>)) }
    end

    class OptGroup < BaseComponent
      # optgroup
      sig { override.returns(String) }
      def default_tag
        "optgroup"
      end
    end

    class Option < BaseComponent
      # option(内容はテキストのみ)
      sig { override.returns(String) }
      def default_tag
        "option"
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) { content.to_s }
      end
    end
  end
end
