# typed: strict
# frozen_string_literal: true

module Shadcn
  # ペインリサイズ(10-roadmap Phase 3「resizable = CSS grid + ドラッグ」)。
  # ハンドルのドラッグで前後パネルの基準幅を配分する
  # JS無効時フォールバック: Graceful(静的レイアウトとして表示される)
  class Resizable < BaseComponent
    class PanelGroup < BaseComponent
      # div(水平flex。垂直は aria-orientation のクラス契約に従う)
      CONTROLLER = "shadcn--resizable"

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "group"
        attributes[:style] = "display: flex" unless @html_args.key?(:style)
        merge_nested(attributes, :data, { controller: CONTROLLER })
        attributes
      end
    end

    class Panel < BaseComponent
      # div。flex-grow の比率は利用者が style で指定する(既定 1)
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:style] = "flex-grow: 1; flex-basis: 0; overflow: auto; min-width: 0; min-height: 0"
        attributes
      end
    end

    class Handle < BaseComponent
      # ドラッグで前後パネルの幅を配分する(キーボードは矢印キー)
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "separator"
        attributes[:tabindex] = "0"
        attributes[:aria] = { orientation: "vertical" }
        attributes[:style] = "cursor: col-resize; flex: 0 0 auto"
        merge_nested(attributes, :data, {
                       action: "mousedown->shadcn--resizable#startDrag keydown->shadcn--resizable#nudge"
                     })
        attributes
      end
    end
  end
end
