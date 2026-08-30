# typed: strict
# frozen_string_literal: true

module Shadcn
  # scroll-snap 相当の横スクロール + ナビ補助(10-roadmap Phase 2)。
  # upstream は embla-carousel を使うが、本gemは生のスクロール操作で再実装する
  # (契約クラス・data-slot は upstream 由来のまま)
  # JS無効時フォールバック: JS必須(スライド自体はSSR済みで読めるが、ナビは動作しない — 05 §5)
  class Carousel < BaseComponent
    CONTROLLER = "shadcn--carousel"

    # upstream のJSXルートは Context.Provider ラッパーで、実要素はその内側の div。
    # 契約上のルートスロット(carousel)から静的属性(role 等)を引く
    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_root_slot
      contract_slot("carousel")
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(controller: CONTROLLER)
    end

    class Content < BaseComponent
      # upstream は外側に overflow-hidden の viewport、内側に契約クラスを持つ
      # 二重構造(accordion-content と同じ split 構造)
      sig { override.returns(String) }
      def call
        attributes = @html_args.merge(class: root_static_class)
        merge_nested(attributes, :data, { slot: contract_root_slot[:name] })
        content_tag(tag, **attributes) do
          content_tag(:div, class: self.class.classes(extra: @user_class)) { content }
        end
      end

      private

      sig { returns(T.nilable(String)) }
      def root_static_class
        T.cast(contract_root_slot.dig(:static_attributes, :class), T.nilable(String))
      end
    end

    class Item < BaseComponent
      # div(role="group" aria-roledescription="slide")。契約静的属性は自動付与
    end

    # Previous/Next の共通部分: upstream は Button(outline/icon)に静的クラスを足して構成する
    class Navigation < BaseComponent
      extend T::Helpers

      abstract!

      private

      # Button へ渡す引数(バリアント既定 + 契約静的クラス + ナビ用data属性)。
      # 利用者指定(variant 等の上書き)を優先する
      sig { returns(T::Hash[Symbol, T.untyped]) }
      def button_attributes
        attributes = {
          variant: :outline,
          size: :icon,
          type: "button",
          disabled: true
        }.merge(@html_args)
        attributes[:class] = self.class.classes(extra: @user_class)
        attributes[:data] = navigation_data.merge(T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {})
        attributes
      end

      # action のみ書き、controller は付けない: ルート(div[data-controller])の
      # インスタンスへイベントを委任する(ボタン自前のインスタンスは viewport を持たない)
      sig { returns(T::Hash[Symbol, T.untyped]) }
      def navigation_data
        {
          slot: self.class.contract.const_get(:ROOT_SLOT),
          action: "#{CONTROLLER}#scroll#{direction.camelize}"
        }
      end

      sig { abstract.returns(String) }
      def direction; end

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
          class: "size-4",
          aria: { hidden: "true" }
        ) do
          raw(paths)
        end
      end
    end

    class Previous < Navigation
      sig { override.returns(String) }
      def call
        render(Button.new(**button_attributes)) do
          safe_join([icon_svg(%(<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>)), screen_reader_label])
        end
      end

      private

      sig { override.returns(String) }
      def direction
        "previous"
      end
    end

    class Next < Navigation
      sig { override.returns(String) }
      def call
        render(Button.new(**button_attributes)) do
          safe_join([icon_svg(%(<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>)), screen_reader_label])
        end
      end

      private

      sig { override.returns(String) }
      def direction
        "next"
      end
    end

    private_constant :Navigation
  end
end
