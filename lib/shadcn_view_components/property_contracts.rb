# typed: strict
# frozen_string_literal: true

require_relative "property_contract_definitions"
require_relative "property_validation"

module ShadcnViewComponents
  # CVA由来のVARIANTSでは表現できない、Rails公開API固有の意味的なprop契約。
  # data属性・ARIA・CSS値へ出す前に、この定義を唯一の値域として正規化する。
  module PropertyContracts
    extend T::Sig

    module_function

    sig { params(component: Symbol, property: Symbol).returns(T::Hash[Symbol, T.untyped]) }
    def fetch(component, property)
      properties = DEFINITIONS.fetch(component) do
        Kernel.raise KeyError, "no property contract for #{component.inspect}"
      end
      properties.fetch(property) do
        Kernel.raise KeyError, "no property contract for #{component.inspect}.#{property}"
      end
    end

    sig { params(component: Symbol, property: Symbol).returns(T.untyped) }
    def default(component, property)
      fetch(component, property).fetch(:default)
    end

    sig do
      params(
        component: Symbol,
        owner: String,
        property: Symbol,
        value: T.untyped
      ).returns(T.untyped)
    end
    def normalize(component:, owner:, property:, value:)
      PropertyValidation.normalize(owner:, property:, value:, definition: fetch(component, property))
    end
  end
end
