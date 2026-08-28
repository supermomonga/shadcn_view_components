# typed: strict
# frozen_string_literal: true

module Shadcn
  # 進捗バー。role=progressbar と aria 値をネイティブARIAで表現する
  class Progress < BaseComponent
    sig { params(value: T.nilable(Integer), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(value: nil, **args)
      @value = value
      super(**args)
    end

    sig { override.returns(String) }
    def call
      content_tag(tag, **html_attributes) do
        content_tag(:div, class: indicator_class, data: { slot: "progress-indicator" },
                          style: "transform: translateX(-#{100 - (@value || 0)}%)") { "".html_safe }
      end
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = super
      attributes[:role] = "progressbar"
      merge_nested(attributes, :aria, { valuenow: @value.to_s, valuemin: "0", valuemax: "100" })
      attributes
    end

    private

    sig { returns(T.nilable(String)) }
    def indicator_class
      T.cast(contract_slot("progress-indicator").dig(:static_attributes, :class), T.nilable(String))
    end
  end
end
