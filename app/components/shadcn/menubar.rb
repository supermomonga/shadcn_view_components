# typed: strict
# frozen_string_literal: true

module Shadcn
  # メニューバー(10-roadmap Phase 3「menubar = 横断」)。
  # 横並びのトリガー群がそれぞれメニューを開く。実装は dropdown-menu と同じ
  # menu_controller(ARIA menu + Popover API)を流用する
  # JS無効時フォールバック: Readable
  class Menubar < BaseComponent
    CONTROLLER = "shadcn--menu"

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(controller: CONTROLLER)
    end

    class Menu < BaseComponent
      # トリガー+コンテンツのスコープ(div)
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
    end

    class Portal < BaseComponent
      # 搬送のみの機能要素の実体化
    end

    class Content < BaseComponent
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "menu"
        attributes[:popover] = "auto"
        attributes[:tabindex] = "-1"
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { state: "closed" }.merge(data)
        attributes
      end
    end

    class Group < BaseComponent
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.tap { |attributes| attributes[:role] = "group" }
      end
    end

    class Label < BaseComponent
      # div
    end

    class Item < BaseComponent
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "menuitem"
        attributes[:tabindex] = "-1"
        merge_nested(attributes, :data, { action: "#{CONTROLLER}#activate" })
        attributes
      end
    end

    class CheckboxItem < Item
      sig { params(checked: T::Boolean, args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(checked: false, **args)
        @checked = checked
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "menuitemcheckbox"
        merge_nested(attributes, :aria, { checked: @checked.to_s })
        attributes
      end
    end

    class RadioGroup < BaseComponent
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.tap { |attributes| attributes[:role] = "group" }
      end
    end

    class RadioItem < CheckboxItem
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.tap { |attributes| attributes[:role] = "menuitemradio" }
      end
    end

    class Separator < BaseComponent
      # div
    end

    class Shortcut < BaseComponent
      # span
    end

    class Sub < BaseComponent
      # ネストしたサブメニューのスコープ
    end

    class SubTrigger < Item
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        merge_nested(attributes, :aria, { haspopup: "menu", expanded: "false" })
        merge_nested(attributes, :data, { action: "#{CONTROLLER}#toggleSub" })
        attributes
      end
    end

    class SubContent < Content
      # 親Contentと同じ構造
    end
  end
end
