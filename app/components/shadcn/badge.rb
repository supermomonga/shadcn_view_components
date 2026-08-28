# typed: strict
# frozen_string_literal: true

module Shadcn
  class Badge < BaseComponent
    # 省略時の既定値は契約の defaults から読む(リテラルで二重管理しない)
    sig do
      params(
        variant: T.any(Symbol, String),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(variant: ShadcnViewComponents::Contracts::Badge::DEFAULTS.fetch(:variant), **args)
      @variant = T.let(normalize_option(:variant, variant), Symbol)
      super(**args)
    end

    sig { returns(Symbol) }
    attr_reader :variant

    sig { override.returns(T::Hash[Symbol, VariantOption]) }
    def variant_options
      { variant: @variant }
    end

    # upstream の動的属性(data-variant)は手書き側の責務として描画する
    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(variant: @variant)
    end
  end
end
