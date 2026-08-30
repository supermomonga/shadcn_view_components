# typed: strict
# frozen_string_literal: true

module Shadcn
  # スライダー(ネイティブ input[type=range] を用いる — 05 §3 ネイティブ最優先)。
  # 契約の track/range 構造は装飾として重ねる
  class Slider < BaseComponent
    sig do
      params(
        min: T.any(Integer, Float, String),
        max: T.any(Integer, Float, String),
        value: T.nilable(T.any(Integer, Float, String)),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(min: self.class.property_default(:min),
                   max: self.class.property_default(:max),
                   value: self.class.property_default(:value), **args)
      @min = T.let(normalize_property(:min, min), T.any(Integer, Float))
      @max = T.let(normalize_property(:max, max), T.any(Integer, Float))
      @value = T.let(normalize_property(:value, value), T.nilable(T.any(Integer, Float)))
      validate_range!
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
      attributes = T.let(
        {
          type: "range",
          min: @min,
          max: @max,
          "aria-label": "slider",
          class: "absolute inset-0 opacity-0"
        },
        T::Hash[Symbol, T.untyped]
      )
      attributes[:value] = @value if @value
      void_tag("input", **attributes)
    end

    sig { void }
    def validate_range!
      raise ArgumentError, "Shadcn::Slider max must be greater than min, got min=#{@min.inspect}, max=#{@max.inspect}" unless @min < @max
      return unless @value && !@value.between?(@min, @max)

      raise ArgumentError,
            "Shadcn::Slider value must be between min and max, got value=#{@value.inspect}, " \
            "min=#{@min.inspect}, max=#{@max.inspect}"
    end

    sig { params(name: String).returns(T.nilable(String)) }
    def slot_class(name)
      T.cast(contract_slot(name).dig(:static_attributes, :class), T.nilable(String))
    end
  end
end
