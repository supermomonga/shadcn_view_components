# typed: strict
# frozen_string_literal: true

module Shadcn
  # スライダー(ネイティブ input[type=range] を用いる — 05 §3 ネイティブ最優先)。
  # class / style / tag はupstreamのRootに、それ以外の利用者HTML属性はフォームコントロールの
  # inputへ渡す。track / range / thumbはinputの現在値を表す装飾で、状態源にはしない。
  class Slider < BaseComponent
    # ブラウザがrange inputへ適用する初期値の制約と、装飾位置の算出を同じ値から行う。
    class InitialState
      extend T::Sig

      sig do
        params(
          min: T.untyped,
          max: T.untyped,
          step: T.untyped,
          value: T.untyped,
          orientation: T.untyped
        ).void
      end
      def initialize(min:, max:, step:, value:, orientation:)
        @min = T.let(normalize_number(:min, min), T.any(Integer, Float))
        @max = T.let(normalize_number(:max, max), T.any(Integer, Float))
        @step = T.let(normalize_number(:step, step), T.any(Integer, Float))
        @value = T.let(normalize_value(value), T.nilable(T.any(Integer, Float)))
        @orientation = T.let(normalize_orientation(orientation), String)
        validate!
      end

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def input_attributes
        attributes = T.let({ min: @min, max: @max, step: @step }, T::Hash[Symbol, T.untyped])
        attributes[:value] = @value if @value
        attributes
      end

      sig { returns(String) }
      attr_reader :orientation

      sig { returns(T::Boolean) }
      def vertical?
        @orientation == "vertical"
      end

      sig { returns(String) }
      def range_style
        if vertical?
          "position: absolute; bottom: 0; height: #{percentage}%"
        else
          "position: absolute; left: 0; width: #{percentage}%"
        end
      end

      sig { returns(String) }
      def thumb_style
        if vertical?
          "position: absolute; bottom: #{percentage}%; left: 50%; transform: translate(-50%, 50%)"
        else
          "position: absolute; left: #{percentage}%; top: 50%; transform: translate(-50%, -50%)"
        end
      end

      private

      sig { params(property: Symbol, value: T.untyped).returns(T.any(Integer, Float)) }
      def normalize_number(property, value)
        T.cast(normalize(property, value), T.any(Integer, Float))
      end

      sig { params(value: T.untyped).returns(T.nilable(T.any(Integer, Float))) }
      def normalize_value(value)
        T.cast(normalize(:value, value), T.nilable(T.any(Integer, Float)))
      end

      sig { params(value: T.untyped).returns(String) }
      def normalize_orientation(value)
        T.cast(normalize(:orientation, value), String)
      end

      sig { params(property: Symbol, value: T.untyped).returns(T.untyped) }
      def normalize(property, value)
        ShadcnViewComponents::PropertyContracts.normalize(
          component: :slider,
          owner: "Shadcn::Slider",
          property:,
          value:
        )
      end

      sig { returns(String) }
      def percentage
        result = ((effective_value - decimal(@min)) / (decimal(@max) - decimal(@min))) * 100
        format("%.12g", result.to_f)
      end

      sig { returns(Rational) }
      def effective_value
        return decimal(@value) if @value

        minimum = decimal(@min)
        step = decimal(@step)
        midpoint = minimum + ((decimal(@max) - minimum) / 2)
        position = (midpoint - minimum) / step
        step_count = position.floor
        step_count += 1 if (position - step_count) * 2 >= 1
        minimum + (step * step_count)
      end

      sig { params(value: T.any(Integer, Float)).returns(Rational) }
      def decimal(value)
        Rational(value.to_s)
      end

      sig { void }
      def validate!
        raise ArgumentError, "Shadcn::Slider max must be greater than min, got min=#{@min.inspect}, max=#{@max.inspect}" unless @min < @max
        if @value && !@value.between?(@min, @max)
          raise ArgumentError,
                "Shadcn::Slider value must be between min and max, got value=#{@value.inspect}, " \
                "min=#{@min.inspect}, max=#{@max.inspect}"
        end

        validate_step_alignment!
      end

      sig { void }
      def validate_step_alignment!
        return unless @value

        steps = (decimal(@value) - decimal(@min)) / decimal(@step)
        return if steps.denominator == 1

        raise ArgumentError,
              "Shadcn::Slider value must align with step from min, got value=#{@value.inspect}, " \
              "min=#{@min.inspect}, step=#{@step.inspect}"
      end
    end

    CONTROLLER = "shadcn--slider"
    INPUT_CLASS = "peer absolute inset-0 z-10 size-full cursor-pointer opacity-0"
    INPUT_ACTION = T.let("input->#{CONTROLLER}#sync change->#{CONTROLLER}#sync".freeze, String)
    THUMB_INPUT_STATE_CLASS = "peer-hover:ring-3 peer-focus-visible:ring-3 peer-active:ring-3 " \
                              "peer-disabled:pointer-events-none peer-disabled:opacity-50"

    private_constant :InitialState, :INPUT_CLASS, :INPUT_ACTION, :THUMB_INPUT_STATE_CLASS

    sig do
      params(
        min: T.any(Integer, Float, String),
        max: T.any(Integer, Float, String),
        step: T.any(Integer, Float, String),
        value: T.nilable(T.any(Integer, Float, String)),
        orientation: T.any(Symbol, String),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(min: self.class.property_default(:min), # rubocop:disable Metrics/ParameterLists
                   max: self.class.property_default(:max),
                   step: self.class.property_default(:step),
                   value: self.class.property_default(:value),
                   orientation: self.class.property_default(:orientation), **args)
      @initial_state = T.let(InitialState.new(min:, max:, step:, value:, orientation:), InitialState)

      # SliderのclassName / tagはupstream RootのAPI。それ以外は実際にフォーカス・
      # 送信されるinputのHTML属性として扱い、wrapperへ誤送しない。
      root_args = T.let({}, T::Hash[Symbol, T.untyped])
      %i[class style tag].each { |key| root_args[key] = args.delete(key) if args.key?(key) }
      @input_args = T.let(args, T::Hash[Symbol, T.untyped])
      super(**root_args)
    end

    sig { override.returns(String) }
    def call
      content_tag(tag, **html_attributes) do
        content_tag(:div, class: control_class, data: part_data) do
          # peer variantでnative inputのhover/focus/active状態をthumbへ渡すため、
          # inputはthumbより前の兄弟に置く。
          safe_join([track, range_input, thumb])
        end
      end
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      super.tap do |attributes|
        merge_nested(attributes, :data, part_data.merge(controller: CONTROLLER))
      end
    end

    private

    sig { returns(String) }
    def track
      content_tag(:div, class: slot_class("slider-track"), data: part_data(slot: "slider-track")) do
        content_tag(
          :div,
          class: slot_class("slider-range"),
          style: @initial_state.range_style,
          data: part_data(slot: "slider-range")
        ) { "".html_safe }
      end
    end

    sig { returns(String) }
    def thumb
      content_tag(
        :span,
        class: thumb_class,
        style: @initial_state.thumb_style,
        aria: { hidden: "true" },
        data: part_data(slot: "slider-thumb")
      ) { "".html_safe }
    end

    sig { returns(String) }
    def range_input
      attributes = T.let(
        @input_args.dup,
        T::Hash[Symbol, T.untyped]
      )
      attributes[:type] = "range"
      attributes[:class] = INPUT_CLASS
      attributes.merge!(@initial_state.input_attributes)

      merge_nested(attributes, :aria, { orientation: @initial_state.orientation })
      merge_input_data(attributes)
      merge_style(attributes, { writing_mode: "vertical-lr", direction: "rtl" }) if @initial_state.vertical?
      void_tag("input", **attributes)
    end

    sig { params(attributes: T::Hash[Symbol, T.untyped]).void }
    def merge_input_data(attributes)
      user_data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
      user_action = user_data[:action]
      attributes[:data] = user_data.merge(
        slot: "slider-input",
        action: [INPUT_ACTION, user_action].compact.join(" ")
      )
    end

    sig { params(slot: T.nilable(String)).returns(T::Hash[Symbol, T.untyped]) }
    def part_data(slot: nil)
      data = T.let({ orientation: @initial_state.orientation }, T::Hash[Symbol, T.untyped])
      data[:slot] = slot if slot
      data[:disabled] = "" if disabled?
      data
    end

    sig { returns(T::Boolean) }
    def disabled?
      !@input_args[:disabled].nil? && @input_args[:disabled] != false
    end

    sig { params(name: String).returns(String) }
    def slot_class(name)
      slot = contract_slot(name)
      raise KeyError, "Slider contract is missing #{name}" if slot.empty?

      static_attributes = T.cast(slot.fetch(:static_attributes), T::Hash[Symbol, T.untyped])
      T.cast(static_attributes.fetch(:class), String)
    end

    sig { returns(String) }
    def thumb_class
      ShadcnViewComponents::Classes::MERGER.merge("#{slot_class('slider-thumb')} #{THUMB_INPUT_STATE_CLASS}")
    end

    sig { returns(String) }
    def control_class
      slot = T.cast(contract.const_get(:SLOTS), T::Array[T::Hash[Symbol, T.untyped]])
              .find { |candidate| candidate[:tag] == "SliderPrimitive.Control" }
      raise KeyError, "Slider contract is missing SliderPrimitive.Control" unless slot

      static_attributes = T.cast(slot.fetch(:static_attributes), T::Hash[Symbol, T.untyped])
      T.cast(static_attributes.fetch(:class), String)
    end
  end
end
