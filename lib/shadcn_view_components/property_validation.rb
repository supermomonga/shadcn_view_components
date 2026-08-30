# typed: strict
# frozen_string_literal: true

require_relative "numeric_property_validation"

module ShadcnViewComponents
  # PropertyContractsに宣言された列挙値・数値を、描画前に正規化する。
  module PropertyValidation
    extend T::Sig

    module_function

    sig do
      params(
        owner: String,
        property: Symbol,
        value: T.untyped,
        definition: T::Hash[Symbol, T.untyped]
      ).returns(T.untyped)
    end
    def normalize(owner:, property:, value:, definition:)
      case definition.fetch(:kind)
      when :enum
        normalize_enum(owner, property, value, definition)
      when :number
        NumericPropertyValidation.normalize(owner:, property:, value:, definition:)
      else
        Kernel.raise KeyError, "unknown property contract kind for #{owner}.#{property}"
      end
    end

    sig do
      params(
        owner: String,
        property: Symbol,
        value: T.untyped,
        definition: T::Hash[Symbol, T.untyped]
      ).returns(String)
    end
    def normalize_enum(owner, property, value, definition)
      values = T.cast(definition.fetch(:values), T::Array[String])
      invalid_property!(owner, property, value, "one of #{values.map(&:inspect).join(', ')}") unless value.is_a?(String) || value.is_a?(Symbol)

      normalized = value.to_s
      return normalized if values.include?(normalized)

      invalid_property!(owner, property, value, "one of #{values.map(&:inspect).join(', ')}")
    end

    sig { params(owner: String, property: Symbol, value: T.untyped, requirement: String).returns(T.noreturn) }
    def invalid_property!(owner, property, value, requirement)
      Kernel.raise ArgumentError, "#{owner} #{property} must be #{requirement}, got #{value.inspect}"
    end
  end
end
