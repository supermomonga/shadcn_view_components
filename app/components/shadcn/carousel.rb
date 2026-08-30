# typed: strict
# frozen_string_literal: true

module Shadcn
  # scroll-snap 相当の縦横スクロール + ナビ補助(10-roadmap Phase 2)。
  # upstream は embla-carousel を使うが、本gemは生のスクロール操作で再実装する
  # (契約クラス・data-slot は upstream 由来のまま)
  # JS無効時フォールバック: JS必須(スライド自体はSSR済みで読めるが、ナビは動作しない — 05 §5)
  class Carousel < BaseComponent
    CONTROLLER = "shadcn--carousel"
    KEYDOWN_ACTION = T.let("keydown->#{CONTROLLER}#navigate".freeze, String)
    ROOT_CLASS = "group/carousel"

    private_constant :KEYDOWN_ACTION, :ROOT_CLASS

    sig do
      params(
        orientation: T.any(Symbol, String),
        direction: T.any(Symbol, String),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(orientation: self.class.property_default(:orientation),
                   direction: self.class.property_default(:direction), **args)
      assign_accessibility_root_id(args, prefix: "carousel")
      @orientation = T.let(normalize_property(:orientation, orientation), String)
      @direction = T.let(normalize_property(:direction, direction), String)
      super(**args)
    end

    # upstream のJSXルートは Context.Provider ラッパーで、実要素はその内側の div。
    # 契約上のルートスロット(carousel)から静的属性(role 等)を引く
    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_root_slot
      contract_slot("carousel")
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = super
      data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
      attributes[:data] = data.merge(
        controller: compose_tokens(CONTROLLER, data[:controller]),
        action: compose_tokens(KEYDOWN_ACTION, data[:action]),
        orientation: @orientation,
        direction: @direction
      )
      attributes[:dir] = @direction
      attributes[:tabindex] = 0 unless attributes.key?(:tabindex)
      attributes
    end

    sig { override.returns(String) }
    def resolved_class
      self.class.classes(extra: [ROOT_CLASS, @user_class].compact.join(" "))
    end

    class Content < BaseComponent
      ORIENTATION_CLASS = "group-data-vertical/carousel:ml-0 group-data-vertical/carousel:-mt-4 " \
                          "group-data-vertical/carousel:flex-col"

      private_constant :ORIENTATION_CLASS

      # upstream は外側に overflow-hidden の viewport、内側に契約クラスを持つ
      # 二重構造(accordion-content と同じ split 構造)
      sig { override.returns(String) }
      def call
        attributes = @html_args.merge(class: root_static_class)
        merge_nested(attributes, :data, { slot: contract_root_slot[:name] })
        content_tag(tag, **attributes) do
          extra = [ORIENTATION_CLASS, @user_class].compact.join(" ")
          content_tag(:div, class: self.class.classes(extra:)) { content }
        end
      end

      private

      sig { returns(T.nilable(String)) }
      def root_static_class
        T.cast(contract_root_slot.dig(:static_attributes, :class), T.nilable(String))
      end
    end

    class Item < BaseComponent
      ORIENTATION_CLASS = "group-data-vertical/carousel:pl-0 group-data-vertical/carousel:pt-4"

      private_constant :ORIENTATION_CLASS

      # div(role="group" aria-roledescription="slide")。契約静的属性は自動付与
      sig { override.returns(String) }
      def resolved_class
        self.class.classes(extra: [ORIENTATION_CLASS, @user_class].compact.join(" "))
      end
    end

    # Previous/Next の共通部分: upstream は Button(outline/icon)に静的クラスを足して構成する
    class Navigation < BaseComponent
      extend T::Helpers

      abstract!

      ORIENTATION_CLASS = "group-data-vertical/carousel:inset-y-auto " \
                          "group-data-vertical/carousel:left-1/2 group-data-vertical/carousel:my-0 " \
                          "group-data-vertical/carousel:-translate-x-1/2 group-data-vertical/carousel:rotate-90"
      RTL_ICON_CLASS = "group-[[data-orientation=horizontal][data-direction=rtl]]/carousel:rotate-180"

      private_constant :ORIENTATION_CLASS, :RTL_ICON_CLASS

      private

      # Button へ渡す引数(バリアント既定 + 契約静的クラス + ナビ用data属性)。
      # 利用者指定(variant 等の上書き)を優先する
      sig { returns(T::Hash[Symbol, T.untyped]) }
      def button_attributes
        attributes = {
          variant: :outline,
          size: :"icon-sm",
          type: "button",
          disabled: true
        }.merge(@html_args)
        attributes[:class] = navigation_class
        merge_navigation_data(attributes)
        attributes
      end

      sig { returns(String) }
      def navigation_class
        extra = [ORIENTATION_CLASS, edge_orientation_class, @user_class].compact.join(" ")
        self.class.classes(extra:)
      end

      sig { params(attributes: T::Hash[Symbol, T.untyped]).void }
      def merge_navigation_data(attributes)
        user_data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = user_data.merge(
          slot: self.class.contract.const_get(:ROOT_SLOT),
          action: compose_tokens(navigation_action, user_data[:action])
        )
      end

      # action のみ書き、controller は付けない: ルート(div[data-controller])の
      # インスタンスへイベントを委任する(ボタン自前のインスタンスは viewport を持たない)
      sig { returns(String) }
      def navigation_action
        "#{CONTROLLER}#scroll#{direction.camelize}"
      end

      sig { abstract.returns(String) }
      def direction; end

      sig { abstract.returns(String) }
      def edge_orientation_class; end

      sig { returns(String) }
      def screen_reader_label
        content_tag(:span, class: "sr-only") { "#{direction.camelize} slide" }
      end

      sig { params(paths: String).returns(String) }
      def icon_svg(paths)
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          width: "16",
          height: "16",
          class: "size-4 #{RTL_ICON_CLASS}",
          aria: { hidden: "true" }
        ) do
          raw(paths)
        end
      end

      sig { params(required: String, supplied: T.untyped).returns(String) }
      def compose_tokens(required, supplied)
        ([required] + supplied.to_s.split).uniq.join(" ")
      end
    end

    class Previous < Navigation
      sig { override.returns(String) }
      def call
        render(Button.new(**button_attributes)) do
          safe_join([icon_svg(%(<path d="m15 18-6-6 6-6"/>)), screen_reader_label])
        end
      end

      private

      sig { override.returns(String) }
      def direction
        "previous"
      end

      sig { override.returns(String) }
      def edge_orientation_class
        "group-data-vertical/carousel:-top-12"
      end
    end

    class Next < Navigation
      sig { override.returns(String) }
      def call
        render(Button.new(**button_attributes)) do
          safe_join([icon_svg(%(<path d="m9 18 6-6-6-6"/>)), screen_reader_label])
        end
      end

      private

      sig { override.returns(String) }
      def direction
        "next"
      end

      sig { override.returns(String) }
      def edge_orientation_class
        "group-data-vertical/carousel:right-auto group-data-vertical/carousel:-bottom-12"
      end
    end

    private

    sig { params(required: String, supplied: T.untyped).returns(String) }
    def compose_tokens(required, supplied)
      ([required] + supplied.to_s.split).uniq.join(" ")
    end

    private_constant :Navigation
  end
end
