# typed: strict
# frozen_string_literal: true

module ShadcnViewComponents
  module NumericPropertyValidation
    extend T::Sig

    NUMBER_PATTERN = /\A[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\z/
    INTEGER_PATTERN = /\A[+-]?\d+\z/

    module_function

    sig do
      params(
        owner: String,
        property: Symbol,
        value: T.untyped,
        definition: T::Hash[Symbol, T.untyped]
      ).returns(T.nilable(T.any(Integer, Float)))
    end
    def normalize(owner:, property:, value:, definition:)
      return nil if value.nil? && definition.fetch(:allow_nil, false)

      number = finite_number(value, integer: definition.fetch(:integer, false))
      invalid_property!(owner, property, value, definition) unless number
      validate_bounds!(owner, property, value, number, definition)
    end

    sig do
      params(value: T.untyped, integer: T::Boolean)
        .returns(T.nilable(T.any(Integer, Float)))
    end
    def finite_number(value, integer:)
      number = integer ? parse_integer(value) : parse_number(value)
      return number if number.is_a?(Integer)

      number if number&.finite?
    end

    sig { params(value: T.untyped).returns(T.nilable(Integer)) }
    def parse_integer(value)
      return value if value.is_a?(Integer)
      return unless value.is_a?(String)

      normalized = value.strip
      normalized.to_i if INTEGER_PATTERN.match?(normalized)
    end

    sig { params(value: T.untyped).returns(T.nilable(T.any(Integer, Float))) }
    def parse_number(value)
      return value if value.is_a?(Integer) || value.is_a?(Float)
      return unless value.is_a?(String)

      normalized = value.strip
      return normalized.to_i if INTEGER_PATTERN.match?(normalized)

      normalized.to_f if NUMBER_PATTERN.match?(normalized)
    end

    sig do
      params(
        owner: String,
        property: Symbol,
        value: T.untyped,
        number: T.any(Integer, Float),
        definition: T::Hash[Symbol, T.untyped]
      ).returns(T.any(Integer, Float))
    end
    def validate_bounds!(owner, property, value, number, definition)
      minimum = T.cast(definition[:minimum], T.nilable(T.any(Integer, Float)))
      maximum = T.cast(definition[:maximum], T.nilable(T.any(Integer, Float)))
      too_small = below_minimum?(number, minimum, definition.fetch(:exclusive_minimum, false))
      too_large = maximum && number > maximum
      invalid_property!(owner, property, value, definition) if too_small || too_large
      number
    end

    sig do
      params(
        number: T.any(Integer, Float),
        minimum: T.nilable(T.any(Integer, Float)),
        exclusive: T::Boolean
      ).returns(T::Boolean)
    end
    def below_minimum?(number, minimum, exclusive)
      return false unless minimum

      exclusive ? number <= minimum : number < minimum
    end

    sig { params(definition: T::Hash[Symbol, T.untyped]).returns(String) }
    def number_requirement(definition)
      description = definition.fetch(:integer, false) ? "a finite integer" : "a finite number"
      description += bounds_requirement(definition)
      description += " or nil" if definition.fetch(:allow_nil, false)
      description
    end

    sig { params(definition: T::Hash[Symbol, T.untyped]).returns(String) }
    def bounds_requirement(definition)
      minimum = definition[:minimum]
      maximum = definition[:maximum]
      return " between #{minimum} and #{maximum}" if minimum && maximum
      return " less than or equal to #{maximum}" if maximum
      return "" unless minimum

      comparison = definition.fetch(:exclusive_minimum, false) ? "greater than" : "greater than or equal to"
      " #{comparison} #{minimum}"
    end

    sig do
      params(
        owner: String,
        property: Symbol,
        value: T.untyped,
        definition: T::Hash[Symbol, T.untyped]
      ).returns(T.noreturn)
    end
    def invalid_property!(owner, property, value, definition)
      requirement = number_requirement(definition)
      Kernel.raise ArgumentError, "#{owner} #{property} must be #{requirement}, got #{value.inspect}"
    end
  end
end
