# typed: strict
# frozen_string_literal: true

module Shadcn
  class Button < BaseComponent
    # 省略時の既定値は契約の defaults から読む(リテラルで二重管理しない)。
    # checked(:never): rest-kwargs の実行時sig検証は sorbet-runtime の誤バインドがあるため
    # 無効化し、srb tc の静的検査に委ねる(BaseComponent#initialize のコメント参照)
    sig do
      params(
        variant: T.any(Symbol, String),
        size: T.any(Symbol, String),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(variant: ShadcnViewComponents::Contracts::Button::DEFAULTS.fetch(:variant),
                   size: ShadcnViewComponents::Contracts::Button::DEFAULTS.fetch(:size), **args)
      @variant = T.let(normalize_option(:variant, variant), Symbol)
      @size = T.let(normalize_option(:size, size), Symbol)
      super(**args)
    end

    sig { returns(Symbol) }
    attr_reader :variant

    sig { returns(Symbol) }
    attr_reader :size

    sig { override.returns(T::Hash[Symbol, VariantOption]) }
    def variant_options
      { variant: @variant, size: @size }
    end

    # upstream の動的属性(data-variant / data-size)は手書き側の責務として描画する
    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(variant: @variant, size: @size)
    end
  end
end
