# typed: strict
# frozen_string_literal: true

module Shadcn
  # セレクトボックス(menu_controller + Popover API の listbox で再実装)。
  # 値の送出には Trigger の name 属性で隠しinputを描く(利用者が指定する)
  # JS無効時フォールバック: Readable(選択肢はSSR済み)
  class Select < BaseComponent
    CONTROLLER = "shadcn--menu"

    # base-nova では Select ルートはプリミティブの別名で契約面を持たない
    # (契約JSONに Select export が無い)。ルートは旧実装どおり「クラス無しの
    # div[data-slot] + controller ホスト」として描くため、契約解決を差し替える
    sig { returns(String) }
    def default_tag
      "div"
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_root_slot
      {}
    end

    sig { returns(String) }
    def resolved_class
      @user_class.to_s
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      { slot: "select", controller: CONTROLLER }
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
        attributes[:role] = "combobox"
        merge_nested(attributes, :aria, { haspopup: "listbox", expanded: "false" })
        merge_nested(attributes, :data, { action: "#{CONTROLLER}#toggle" })
        attributes
      end
    end

    class Value < BaseComponent
      # span(Trigger の内側に置く表示用)
    end

    class Content < BaseComponent
      # 契約スロット構成: 名前無しラッパー(portal相当) > select-content。
      # base-nova では位置指定は Anchor幅追従のCSS variantに統合された(position prop廃止)
      sig { override.returns(String) }
      def call
        content_tag(:div) do
          content_tag(tag, **content_attributes) { content }
        end
      end

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def content_attributes
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
        attributes[:role] = "listbox"
        attributes[:popover] = "auto"
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { slot: "select-content" }.merge(data)
        attributes
      end

      private

      sig { returns(T.nilable(String)) }
      def wrapper_class
        T.cast(contract_slot("").dig(:static_attributes, :class), T.nilable(String))
      end
    end

    class Group < BaseComponent
      # div
    end

    class Item < BaseComponent
      sig { params(value: T.nilable(String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(value: nil, **args)
        @value = value
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "option"
        attributes[:tabindex] = "-1"
        merge_nested(attributes, :data, { value: @value }.compact)
        attributes
      end

      # base-nova の select-item は indicator スロットを持たない(選択表現は item 自身の背景)
    end

    class Label < BaseComponent
      # div
    end

    class Separator < BaseComponent
      # div
    end

    class ScrollUpButton < BaseComponent
      # div(装飾。スクロールは本体のoverflowに任せる)
    end

    class ScrollDownButton < BaseComponent
      # div
    end
  end
end
