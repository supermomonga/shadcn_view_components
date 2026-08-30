# typed: strict
# frozen_string_literal: true

module Shadcn
  # ペインリサイズ。ハンドルのドラッグ/矢印キーで前後パネルの
  # flex-basis を配分する(10-roadmap Phase 3 の「CSS grid」案を
  # flex-basis で実装したもの。契約・parity は flex 前提)
  # JS無効時フォールバック: Graceful(静的レイアウトとして表示される)
  # Resizable自体は名前空間であり、描画には配下のクラスを使う。
  module Resizable
    class PanelGroup < BaseComponent
      # div(水平flex。垂直は aria-orientation のクラス契約に従う)
      CONTROLLER = "shadcn--resizable"

      sig do
        params(orientation: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never)
      end
      def initialize(orientation: self.class.property_default(:orientation), **args)
        @orientation = T.let(normalize_property(:orientation, orientation), String)
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "group"
        merge_nested(attributes, :aria, { orientation: @orientation })
        merge_style(attributes, { display: "flex" })
        merge_nested(attributes, :data, { controller: CONTROLLER })
        attributes
      end
    end

    class Panel < BaseComponent
      # div。flex-grow の比率は利用者が style で指定する(既定 1)
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        merge_style(attributes, { "flex-grow": "1", "flex-basis": "0", overflow: "auto",
                                  "min-width": "0", "min-height": "0" })
        attributes
      end
    end

    class Handle < BaseComponent
      # ドラッグで前後パネルの幅を配分する(キーボードは矢印キー)。
      # orientation はセパレータ自身の向き(縦積みグループでは horizontal)で、
      # グループの orientation の逆になる
      sig do
        params(orientation: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never)
      end
      def initialize(orientation: self.class.property_default(:orientation), **args)
        @orientation = T.let(normalize_property(:orientation, orientation), String)
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "separator"
        attributes[:tabindex] = "0"
        merge_nested(attributes, :aria, { orientation: @orientation })
        merge_style(attributes, { cursor: @orientation == "vertical" ? "col-resize" : "row-resize",
                                  flex: "0 0 auto" })
        merge_nested(attributes, :data, {
                       action: "mousedown->shadcn--resizable#startDrag keydown->shadcn--resizable#nudge"
                     })
        attributes
      end
    end
  end
end
