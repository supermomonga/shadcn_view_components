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

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(controller: CONTROLLER)
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
      # 契約スロット構成: drawer-portal(ラッパー) > drawer-content + ドラッグハンドル。
      # ハンドルは data-slot を持たない装飾要素
      sig { override.returns(String) }
      def call
        content_tag(:div, data: { slot: "drawer-portal" }) do
          content_tag(:dialog, **content_attributes) do
            safe_join([drag_handle, content.presence].compact)
          end
        end
      end

      private

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def content_attributes
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { slot: "drawer-content", state: "closed", "vaul-drawer-direction": "bottom" }.merge(data)
        aria = T.cast(attributes[:aria], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:aria] = { modal: "true" }.merge(aria)
        attributes
      end

      # upstream のドラッグハンドル(静的クラスは vaul 方向クラス付き)
      sig { returns(String) }
      def drag_handle
        content_tag(:div, class: "mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted " \
                                 "group-data-[vaul-drawer-direction=bottom]/drawer-content:block") { "".html_safe }
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
