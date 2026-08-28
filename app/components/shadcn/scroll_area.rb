# typed: strict
# frozen_string_literal: true

module Shadcn
  class ScrollArea < BaseComponent
    # 契約タグは ScrollAreaPrimitive.Root/Viewport。ネイティブな CSSスクロールで再現する
    # (05-stimulus-hotwire §3「scroll-area = CSSユーティリティ」)。
    # overflow-auto は本ライブラリの装飾(契約クラスはRadixの構造前提のため)
    sig { override.returns(String) }
    def call
      content_tag(tag, **html_attributes) do
        content_tag(:div, class: viewport_class, data: { slot: "scroll-area-viewport" }) { content }
      end
    end

    private

    sig { returns(String) }
    def viewport_class
      contract_class = T.cast(contract_slot("scroll-area-viewport").dig(:static_attributes, :class), T.nilable(String))
      [contract_class, "size-full overflow-auto"].compact.join(" ")
    end

    class Scrollbar < BaseComponent
      # ネイティブCSSスクロールでは独自スクロールバー部品は不要。契約構造を保つため
      # 描画するが、表示はCSSスクロールバーが担う。
      # orientation は enum ガード(orientation === "horizontal" && ...)の露出prop
      sig do
        params(orientation: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never)
      end
      def initialize(orientation: ShadcnViewComponents::Contracts::ScrollArea::Scrollbar::DEFAULTS.fetch(:orientation), **args)
        @orientation = T.let(normalize_option(:orientation, orientation), Symbol)
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { orientation: @orientation }
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          content_tag(:span, data: { slot: "scroll-area-thumb" }, class: thumb_class) { content }
        end
      end

      private

      sig { returns(String) }
      def thumb_class
        T.cast(contract_slot("scroll-area-thumb").dig(:static_attributes, :class), T.nilable(String)).to_s
      end
    end
  end
end
