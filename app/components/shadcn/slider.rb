# typed: strict
# frozen_string_literal: true

module Shadcn
  # スライダー(ネイティブ input[type=range] を用いる — 05 §3 ネイティブ最優先)。
  # 契約の track/range 構造は装飾として重ねる
  class Slider < BaseComponent
    sig do
      params(
        min: T.nilable(T.any(Integer, String)),
        max: T.nilable(T.any(Integer, String)),
        value: T.nilable(T.any(Integer, String)),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(min: 0, max: 100, value: nil, **args)
      @min = min
      @max = max
      @value = value
      super(**args)
    end

    sig { override.returns(String) }
    def call
      content_tag(tag, **html_attributes) do
        safe_join([
                    content_tag(:div, class: slot_class("slider-track"), data: { slot: "slider-track" }) do
                      content_tag(:div, class: slot_class("slider-range"), data: { slot: "slider-range" }) { "".html_safe }
                    end,
                    range_input
                  ])
      end
    end

    private

    sig { returns(String) }
    def range_input
      content_tag(:input,
                  type: "range", min: @min, max: @max, value: @value,
                  "aria-label": "slider", class: "absolute inset-0 opacity-0") { "".html_safe }
    end

    sig { params(name: String).returns(T.nilable(String)) }
    def slot_class(name)
      T.cast(contract_slot(name).dig(:static_attributes, :class), T.nilable(String))
    end
  end
end
