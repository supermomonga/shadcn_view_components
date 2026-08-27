# typed: strict
# frozen_string_literal: true

module Shadcn
  class Alert < BaseComponent
    sig do
      params(
        variant: T.any(Symbol, String),
        args: T::Hash[Symbol, T.untyped]
      ).void
    end
    def initialize(variant: ShadcnViewComponents::Contracts::Alert::DEFAULTS.fetch(:variant), **args)
      @variant = T.let(normalize_option(:variant, variant), Symbol)
      super(**args)
    end

    sig { returns(Symbol) }
    attr_reader :variant

    sig { override.returns(T::Hash[Symbol, VariantOption]) }
    def variant_options
      { variant: @variant }
    end

    class Title < BaseComponent
    end

    class Description < BaseComponent
    end
  end
end
