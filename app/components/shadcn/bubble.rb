# typed: strict
# frozen_string_literal: true

module Shadcn
  # チャットの吹き出し(Phase 4)
  class Bubble < BaseComponent
    sig { params(variant: T.any(Symbol, String), align: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(variant: ShadcnViewComponents::Contracts::Bubble::DEFAULTS.fetch(:variant),
                   align: self.class.property_default(:align), **args)
      @variant = T.let(normalize_option(:variant, variant), Symbol)
      @align = T.let(normalize_property(:align, align), String)
      super(**args)
    end

    sig { override.returns(T::Hash[Symbol, VariantOption]) }
    def variant_options
      { variant: @variant }
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(variant: @variant, align: @align)
    end

    class Group < BaseComponent
      # div
    end

    class Content < BaseComponent
      # div
    end

    class Reactions < BaseComponent
      # リアクション一覧(align/side)
      sig do
        params(
          align: T.any(Symbol, String),
          side: T.any(Symbol, String),
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(align: ShadcnViewComponents::Contracts::Bubble::Reactions::DEFAULTS.fetch(:align),
                     side: ShadcnViewComponents::Contracts::Bubble::Reactions::DEFAULTS.fetch(:side), **args)
        @align = T.let(normalize_option(:align, align), Symbol)
        @side = T.let(normalize_option(:side, side), Symbol)
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { align: @align, side: @side }
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def contract_data_attributes
        super.merge(align: @align, side: @side)
      end
    end
  end
end
