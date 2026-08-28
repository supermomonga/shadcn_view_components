# typed: strict
# frozen_string_literal: true

module Shadcn
  class InputGroup < BaseComponent
    # upstream は Button を asChild で重ねる。本gemでは Button 描画結果に
    # data-slot を差し替える(Phase 3 の AlertDialogAction と同じ構成)。
    # NOTE: Shadcn::Button の sidecar テンプレートと名前が衝突するため専用ファイルに置く
    class Button < BaseComponent
      sig do
        params(
          variant: T.any(Symbol, String),
          size: T.any(Symbol, String),
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(variant: :ghost, size: "xs", **args)
        @variant = variant
        @size = T.let(normalize_option(:size, size), Symbol)
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { size: @size }
      end

      # 契約は Button(ba_buttonVariants) との合成結果を事前解決済みのため、
      # ここではその最終クラスをそのまま描く(upstream の DOM と同一)
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:type] = "button" unless attributes.key?(:type)
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { size: @size }.merge(data)
        attributes
      end
    end
  end
end
