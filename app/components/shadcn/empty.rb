# typed: strict
# frozen_string_literal: true

module Shadcn
  class Empty < BaseComponent
    class Header < BaseComponent; end

    class Title < BaseComponent; end

    class Description < BaseComponent; end

    class Content < BaseComponent; end

    class Media < BaseComponent
      sig do
        params(
          variant: T.any(Symbol, String),
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(variant: ShadcnViewComponents::Contracts::Empty::Media::DEFAULTS.fetch(:variant), **args)
        @variant = T.let(normalize_option(:variant, variant), Symbol)
        super(**args)
      end

      sig { returns(Symbol) }
      attr_reader :variant

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { variant: @variant }
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def contract_data_attributes
        super.merge(variant: @variant)
      end
    end
  end
end
