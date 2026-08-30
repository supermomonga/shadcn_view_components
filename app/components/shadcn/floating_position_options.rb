# typed: strict
# frozen_string_literal: true

module Shadcn
  # 浮動要素の希望配置を、各コンポーネントで共通の data 属性へ変換する。
  # 実際の配置結果に使う data-side / data-align とは属性を分け、衝突回避後の
  # 値が次回表示時の希望配置へ混入しないようにする。
  module FloatingPositionOptions
    extend T::Sig

    SIDES = %w[top right bottom left inline-start inline-end].freeze
    ALIGNS = %w[start center end].freeze
    INTEGER_PATTERN = /\A[+-]?\d+\z/
    NUMBER_PATTERN = /\A[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?\z/i

    class Values < T::Struct
      const :side, String
      const :align, String
      const :side_offset, T.any(Integer, Float)
      const :align_offset, T.any(Integer, Float)
      const :collision_padding, T.any(Integer, Float)
    end

    sig { params(args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(**args)
      defaults = T.cast(T.unsafe(self).class.const_get(:FLOATING_POSITION_DEFAULTS), T::Hash[Symbol, T.untyped])
      @floating_position = T.let(normalize_position_options(args, defaults), Values)
      super
    end

    private

    sig { params(attributes: T::Hash[Symbol, T.untyped], defaults: T::Hash[Symbol, T.untyped]).returns(T::Hash[Symbol, T.untyped]) }
    def merge_floating_position_data(attributes, defaults = {})
      user_data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
      attributes[:data] = defaults.merge(floating_position_data).merge(user_data)
      attributes
    end

    sig { returns(T::Hash[Symbol, T.untyped]) }
    def floating_position_data
      {
        position_side: @floating_position.side,
        position_align: @floating_position.align,
        position_side_offset: @floating_position.side_offset,
        position_align_offset: @floating_position.align_offset,
        position_collision_padding: @floating_position.collision_padding
      }
    end

    sig do
      params(
        args: T::Hash[Symbol, T.untyped],
        defaults: T::Hash[Symbol, T.untyped]
      ).returns(Values)
    end
    def normalize_position_options(args, defaults)
      Values.new(
        side: normalize_position_choice(:side, extract_position_option(args, defaults, :side), SIDES),
        align: normalize_position_choice(:align, extract_position_option(args, defaults, :align), ALIGNS),
        side_offset: normalize_position_number(:side_offset, extract_position_option(args, defaults, :side_offset)),
        align_offset: normalize_position_number(:align_offset, extract_position_option(args, defaults, :align_offset)),
        collision_padding: normalize_position_number(
          :collision_padding,
          extract_position_option(args, defaults, :collision_padding),
          non_negative: true
        )
      )
    end

    sig do
      params(
        args: T::Hash[Symbol, T.untyped],
        defaults: T::Hash[Symbol, T.untyped],
        name: Symbol
      ).returns(T.untyped)
    end
    def extract_position_option(args, defaults, name)
      return args.delete(name) if args.key?(name)

      defaults.fetch(name)
    end

    sig do
      params(
        name: Symbol,
        value: T.untyped,
        allowed: T::Array[String]
      ).returns(String)
    end
    def normalize_position_choice(name, value, allowed)
      normalized = value.to_s
      return normalized if (value.is_a?(String) || value.is_a?(Symbol)) && allowed.include?(normalized)

      Kernel.raise ArgumentError,
                   "unknown floating position #{name} #{value.inspect} (valid: #{allowed.join(', ')})"
    end

    sig do
      params(
        name: Symbol,
        value: T.untyped,
        non_negative: T::Boolean
      ).returns(T.any(Integer, Float))
    end
    def normalize_position_number(name, value, non_negative: false)
      number = parse_position_number(value)
      invalid_position_number!(name, value, non_negative) unless number
      invalid_position_number!(name, value, non_negative) unless number.to_f.finite?
      invalid_position_number!(name, value, non_negative) if non_negative && number.negative?

      number
    end

    sig { params(value: T.untyped).returns(T.nilable(T.any(Integer, Float))) }
    def parse_position_number(value)
      return value if value.is_a?(Integer) || value.is_a?(Float)
      return unless value.is_a?(String)

      normalized = value.strip
      return normalized.to_i if INTEGER_PATTERN.match?(normalized)

      normalized.to_f if NUMBER_PATTERN.match?(normalized)
    end

    sig { params(name: Symbol, value: T.untyped, non_negative: T::Boolean).returns(T.noreturn) }
    def invalid_position_number!(name, value, non_negative)
      requirement = non_negative ? "a finite non-negative number" : "a finite number"
      Kernel.raise ArgumentError, "floating position #{name} must be #{requirement}, got #{value.inspect}"
    end
  end
end
