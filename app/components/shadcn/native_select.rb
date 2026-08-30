# typed: strict
# frozen_string_literal: true

module Shadcn
  # 素の select/optgroup/option(JSレス — 05 §3)。ラッパーdiv + select + chevron。
  # 利用者属性(name/id/required 等)はすべて実際の <select> に渡す
  # (ラッパーは gem 内部要素のため name 等が届かないフォーム送信の破壊を防ぐ)
  class NativeSelect < BaseComponent
    sig { params(size: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(size: self.class.property_default(:size), **args)
      @size = T.let(normalize_property(:size, size), String)
      super(**args)
    end

    sig { override.returns(String) }
    def call
      # base-nova ではユーザークラス(className)はラッパーへ流れる
      content_tag(:div, class: wrapper_class, data: { slot: "native-select-wrapper", size: @size }) do
        safe_join([select_element, chevron_icon])
      end
    end

    private

    # 選択肢は OptGroup / Option コンポーネントで content に渡す
    sig { returns(String) }
    def select_element
      attributes = @html_args.merge(class: select_class)
      merge_nested(attributes, :data, { slot: "native-select", size: @size })
      content_tag(:select, **attributes) { content }
    end

    # ラッパーのクラスは契約combination(group/native-select ...)
    sig { returns(String) }
    def wrapper_class
      ShadcnViewComponents::Classes.resolve(:native_select, extra: @user_class.to_s)
    end

    # select 要素のクラスは契約スロットの静的クラス
    sig { returns(T.nilable(String)) }
    def select_class
      T.cast(contract_slot("native-select").dig(:static_attributes, :class), T.nilable(String))
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
