# typed: strict
# frozen_string_literal: true

module Shadcn
  # ネイティブ `<dialog>` + showModal によるモーダル(05-stimulus-hotwire §3)。
  # フォーカストラップ・EscClose・背景inert・フォーカス復帰はネイティブが提供する。
  # JS無効時フォールバック: Readable(dialog要素は閉じた状態で出力されるため
  # 内容は取得できる。開く操作にはJSが必要 — 05 §5)
  class Dialog < BaseComponent
    CONTROLLER = "shadcn--dialog"

    # upstream の Root はDOMを出力しないが、本gemではトリガーとコンテンツを
    # 同一のコントローラスコープに置くためのラッパーとして描く(文書化された構造差)
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
        merge_nested(attributes, :data, { action: "#{Dialog::CONTROLLER}#show" })
        attributes
      end
    end

    class Portal < BaseComponent
      # upstream の Portal は子を body 末尾へ搬送するだけの機能要素。
      # 本gemではラッパー div として実体化する(契約スロットの維持のため)
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
        merge_nested(attributes, :data, { action: "#{Dialog::CONTROLLER}#close" })
        attributes
      end
    end

    class Overlay < BaseComponent
      # 契約上は Content の外に置かれる独立エクスポート。ネイティブ運用では
      # dialogの ::backdrop で代替するため、コンテンツ側には含めない
      # (利用者が明示的に描きたい場合に備えて公開する)
    end

    class Content < BaseComponent
      # 契約スロット構成: dialog-portal(ラッパー) > dialog-content(dialog要素)
      # + dialog-close(右上クローズ)。オーバーレイは ::backdrop で代替する
      sig { params(show_close_button: T::Boolean, args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(show_close_button: true, **args)
        @show_close_button = show_close_button
        super(**args)
      end

      sig { override.returns(String) }
      def default_tag
        "div"
      end

      sig { override.returns(String) }
      def call
        content_tag(:div, data: { slot: "dialog-portal" }) { dialog_element }
      end

      private

      sig { returns(String) }
      def dialog_element
        content_tag(:dialog, **content_attributes) do
          safe_join([content.presence, close_button].compact)
        end
      end

      # upstream のクローズボタン(静的クラスは契約スロットの static_attributes 由来)
      sig { returns(T.nilable(String)) }
      def close_button
        return nil unless @show_close_button

        content_tag(
          :button,
          type: "button",
          class: close_class,
          data: { slot: "dialog-close", action: "#{Dialog::CONTROLLER}#close" },
          aria: { label: "Close" }
        ) do
          safe_join([close_icon, content_tag(:span, class: "sr-only") { "Close" }])
        end
      end

      # lucide のXIcon相当
      sig { returns(String) }
      def close_icon
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
          raw(%(<path d="M18 6 6 18"/><path d="m6 6 12 12"/>))
        end
      end

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def content_attributes
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { slot: "dialog-content", state: "closed" }.merge(data)
        aria = T.cast(attributes[:aria], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:aria] = { modal: "true" }.merge(aria)
        attributes
      end

      sig { returns(T.nilable(String)) }
      def close_class
        T.cast(contract_slot("dialog-close").dig(:static_attributes, :class), T.nilable(String))
      end
    end

    class Header < BaseComponent
      # div
    end

    class Footer < BaseComponent
      # div(末尾の任意クローズボタンは利用者が Dialog::Close として置く)
    end

    class Title < BaseComponent
      # h2(Radix Title の既定)
      sig { override.returns(String) }
      def default_tag
        "h2"
      end
    end

    class Description < BaseComponent
      # p
      sig { override.returns(String) }
      def default_tag
        "p"
      end
    end
  end
end
