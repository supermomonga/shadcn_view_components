# typed: strict
# frozen_string_literal: true

module Shadcn
  # ナビゲーションメニュー(10-roadmap Phase 3)。
  # トリガーの開閉は details/summary 風ではなく menu_controller(Popover API)で行う
  # JS無効時フォールバック: Readable(リンク自体はSSR済みで辿れる)
  class NavigationMenu < BaseComponent
    CONTROLLER = "shadcn--menu"

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(controller: CONTROLLER)
    end

    class List < BaseComponent
      # ul
      sig { override.returns(String) }
      def default_tag
        "ul"
      end
    end

    class Item < BaseComponent
      # li
      sig { override.returns(String) }
      def default_tag
        "li"
      end
    end

    class Trigger < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:type] = "button" unless attributes.key?(:type)
        merge_nested(attributes, :aria, { haspopup: "menu", expanded: "false" })
        merge_nested(attributes, :data, { action: "#{CONTROLLER}#toggle" })
        attributes
      end

      # upstream は chevron を含む(静的クラスは契約スロット外)
      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([content, chevron_icon])
        end
      end

      private

      sig { returns(String) }
      def chevron_icon
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          width: "12",
          height: "12",
          class: "relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180",
          aria: { hidden: "true" }
        ) do
          raw(%(<path d="m6 9 6 6 6-6"/>))
        end
      end
    end

    class Link < BaseComponent
      # a
      sig { override.returns(String) }
      def default_tag
        "a"
      end
    end

    class Content < BaseComponent
      include Shadcn::FloatingPositionOptions

      FLOATING_POSITION_DEFAULTS = T.let(
        { side: :bottom, align: :start, side_offset: 8, align_offset: 0, collision_padding: 5 }.freeze,
        T::Hash[Symbol, T.untyped]
      )

      # Popover API で開閉(ul)
      sig { override.returns(String) }
      def default_tag
        "ul"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:popover] = "auto"
        merge_floating_position_data(attributes, state: "closed")
      end
    end

    class Indicator < BaseComponent
      # 装飾要素(矢印)。既定では非表示
      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          content_tag(:div, class: "relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md") { "".html_safe }
        end
      end
    end

    # base-nova では Viewport が廃止され Positioner(Portal 由来の位置決め)に置き換わった。
    # 本gemは viewport/positioner なしで Content を直接表示する設計のため、両方を移植しない
  end
end
