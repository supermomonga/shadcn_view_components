# typed: strict
# frozen_string_literal: true

module Shadcn
  class Button < BaseComponent
    # 省略時の既定値は契約の defaults から読む(リテラルで二重管理しない)。
    # checked(:never): rest-kwargs の実行時sig検証は sorbet-runtime の誤バインドがあるため
    # 無効化し、srb tc の静的検査に委ねる(BaseComponent#initialize のコメント参照)
    sig { override.returns(String) }
    def default_tag
      "button"
    end

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
    # base-nova の button は data-variant / data-size をDOMへ出さないため、
    # 動的属性の上書きは行わない(契約どおり)
  end
end
