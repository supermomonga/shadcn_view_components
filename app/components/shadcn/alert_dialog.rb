# typed: strict
# frozen_string_literal: true

module Shadcn
  # 確認ダイアログ(ネイティブ `<dialog>` + role="alertdialog")。
  # EscはARIA Authoring Practicesのモーダルダイアログと同じく閉じる操作とし、
  # ネイティブ <dialog> の cancel 動作に委ねる。
  # JS無効時フォールバック: Readable(dialog と同じ)
  class AlertDialog < BaseComponent
    CONTROLLER = "shadcn--dialog"

    sig { params(args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(**args)
      assign_accessibility_root_id(args, prefix: "alert-dialog")
      super
    end

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

    class Portal < BaseComponent
      # upstream の Portal は子を body 末尾へ搬送するだけの機能要素。
      # 本gemではラッパー div として実体化する(Dialog::Portal と同じ)
    end

    class Overlay < BaseComponent
      # Dialog::Overlay と同じ扱い(::backdrop で代替)
    end

    class Content < BaseComponent
      # 契約スロット構成: alert-dialog-content のみ(portal/overlayは契約外)。
      # サイズ(default/sm)は data-size で表現する
      sig { params(size: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(size: self.class.property_default(:size), **args)
        @size = T.let(normalize_property(:size, size), String)
        super(**args)
      end

      sig { override.returns(String) }
      def call
        content_tag(:dialog, **content_attributes) { content }
      end

      private

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def content_attributes
        attributes = @html_args.merge(
          class: self.class.classes(extra: @user_class),
          role: "alertdialog"
        )
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { slot: "alert-dialog-content", size: @size }.merge(data)
        aria = T.cast(attributes[:aria], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:aria] = { modal: "true" }.merge(aria)
        attributes
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

    class Media < BaseComponent
      # div(アイコン等を含める領域)
    end

    # Action/Cancel: upstream は Button を asChild で重ねる。本gemでは Button の
    # 描画結果に data-slot を差し替えて出す(どちらも押下でダイアログを閉じる)
    class Action < BaseComponent
      sig do
        params(
          variant: T.any(Symbol, String),
          size: T.any(Symbol, String),
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(variant: :default, size: :default, **args)
        @variant = T.let(ShadcnViewComponents::Classes.normalize_option(:button, :variant, variant), Symbol)
        @size = T.let(ShadcnViewComponents::Classes.normalize_option(:button, :size, size), Symbol)
        super(**args)
      end

      sig { override.returns(String) }
      def call
        render(Button.new(variant: @variant, size: @size, type: "button", **button_attributes)) { content }
      end

      private

      # Cancel 側は alert-dialog-cancel を上書きする
      sig { returns(String) }
      def slot_name
        "alert-dialog-action"
      end

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def button_attributes
        data = T.cast(@html_args[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        @html_args.merge(
          data: { slot: slot_name, action: "#{CONTROLLER}#close" }.merge(data),
          class: @user_class
        )
      end
    end

    class Cancel < Action
      sig do
        params(
          variant: T.any(Symbol, String),
          size: T.any(Symbol, String),
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(variant: :outline, size: :default, **args)
        super
      end

      private

      sig { override.returns(String) }
      def slot_name
        "alert-dialog-cancel"
      end
    end
  end
end
