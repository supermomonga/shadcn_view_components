# typed: strict
# frozen_string_literal: true

module Shadcn
  # ボトムシート(ネイティブ <dialog>)。upstream は vaul(ドラッグ操作)を使うが、
  # 本gemは開閉のみをネイティブで提供し、クラス契約は vaul の data 属性付きの
  # まま維持する(ドラッグ方向クラスはホストが data-vaul-drawer-direction を
  # 制御する場合に有効化される)
  # JS無効時フォールバック: Readable
  class Drawer < BaseComponent
    CONTROLLER = "shadcn--dialog"

    sig { params(args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(**args)
      assign_accessibility_root_id(args, prefix: "drawer")
      super
    end

    # base-nova では Drawer ルートも data-slot="drawer" を持つ(旧契約には無し)
    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(slot: "drawer", controller: CONTROLLER)
    end

    class Trigger < BaseComponent
      include Shadcn::ButtonStyled

      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = apply_button_styling(super)
        attributes[:type] = "button" unless attributes.key?(:type)
        merge_nested(attributes, :aria, { haspopup: "dialog", expanded: "false" })
        merge_nested(attributes, :data, { action: "#{CONTROLLER}#show" })
        attributes
      end
    end

    class Close < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:type] = "button" unless attributes.key?(:type)
        merge_nested(attributes, :data, { action: "#{CONTROLLER}#close" })
        attributes
      end
    end

    class Portal < BaseComponent
      # upstream の Portal(子を body 末尾へ搬送する機能要素)の実体化。
      # DrawerContent 内部でも同じラッパーを描く
    end

    class Overlay < BaseComponent
      # 契約上は独立エクスポート。ネイティブ運用では ::backdrop で代替するため
      # Content 側には含めない(利用者が明示的に描く場合に備えて公開)
    end

    class Content < BaseComponent
      # 契約スロット構成(base-nova): drawer-portal > drawer-viewport > drawer-popup
      # > drawer-content + ドラッグハンドル。ハンドルは data-slot を持たない装飾要素。
      # viewport / popup をネイティブ <dialog> の内側に置くことで、閉じ状態では
      # UAスタイル(display: none)によりオーバーレイが表示されない(open時はtop-layer)。
      # data-modal は Base UI がモーダル時に付与する属性(本gemは常にモーダル)
      sig { override.returns(String) }
      def call
        content_tag(:div, data: { slot: "drawer-portal" }) do
          content_tag(:dialog, **dialog_attributes) do
            content_tag(:div, class: slot_class("drawer-viewport"), data: { slot: "drawer-viewport", modal: "true" }) do
              content_tag(:div, class: popup_class, data: { slot: "drawer-popup" }) do
                content_tag(:div, **content_attributes) do
                  safe_join([drag_handle, content.presence].compact)
                end
              end
            end
          end
        end
      end

      private

      # 契約クラス(combination)は drawer-popup 要素に属する
      sig { returns(String) }
      def popup_class
        self.class.classes(extra: @user_class)
      end

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def dialog_attributes
        attributes = @html_args
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { "vaul-drawer-direction": "bottom" }.merge(data)
        aria = T.cast(attributes[:aria], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:aria] = { modal: "true" }.merge(aria)
        attributes
      end

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def content_attributes
        attributes = { class: slot_class("drawer-content") }
        data = { slot: "drawer-content", "vaul-drawer-direction": "bottom" }
        attributes[:data] = data
        attributes
      end

      # viewport / content のクラスは契約スロットの静的クラス
      sig { params(name: String).returns(T.nilable(String)) }
      def slot_class(name)
        T.cast(contract_slot(name).dig(:static_attributes, :class), T.nilable(String))
      end

      # upstream のドラッグハンドル(装飾要素)
      sig { returns(String) }
      def drag_handle
        content_tag(:div, class: "mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted") { "".html_safe }
      end
    end

    class Header < BaseComponent
      # div
    end

    class Footer < BaseComponent
      # div
    end

    class Title < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "h2"
      end
    end

    class Description < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "p"
      end
    end
  end
end
