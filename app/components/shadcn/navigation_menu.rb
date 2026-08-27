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
      # Popover API で開閉(ul)
      sig { override.returns(String) }
      def default_tag
        "ul"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:popover] = "auto"
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { state: "closed" }.merge(data)
        attributes
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

    class Viewport < BaseComponent
      # 契約スロット構成: 名前無しラッパー(div.absolute...) > navigation-menu-viewport。
      # 本gemではviewportなしでContentを直接表示するため、ラッパー込みで描く
      sig { override.returns(String) }
      def call
        content_tag(:div, class: wrapper_class) do
          content_tag(tag, **inner_attributes) { content }
        end
      end

      private

      sig { returns(T.nilable(String)) }
      def wrapper_class
        T.cast(contract_slot("").dig(:static_attributes, :class), T.nilable(String))
      end

      # 内側要素にはラッパーの静的クラスを混ぜない(契約クラスのみ)
      sig { returns(T::Hash[Symbol, T.untyped]) }
      def inner_attributes
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { slot: "navigation-menu-viewport" }.merge(data)
        attributes
      end
    end
  end
end
