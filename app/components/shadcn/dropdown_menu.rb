# typed: strict
# frozen_string_literal: true

module Shadcn
  # ARIA menu パターン + Popover API(10-roadmap Phase 3「dropdown-menu = Popover API +
  # ARIA menu + 共通キーボードlib」)。キーボード操作(矢印・Home/End・Esc・文字検索)は
  # menu_controller が担う
  # JS無効時フォールバック: Readable(項目はSSR済み。開閉はJS依存)
  class DropdownMenu < BaseComponent
    CONTROLLER = "shadcn--menu"

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
        merge_nested(attributes, :aria, { haspopup: "menu", expanded: "false" })
        merge_nested(attributes, :data, { action: "#{DropdownMenu::CONTROLLER}#toggle" })
        attributes
      end
    end

    class Portal < BaseComponent
      # 搬送のみの機能要素の実体化(Dialog::Portal と同じ)
    end

    class Content < BaseComponent
      include Shadcn::FloatingPositionOptions

      FLOATING_POSITION_DEFAULTS = T.let(
        { side: :bottom, align: :start, side_offset: 4, align_offset: 0, collision_padding: 5 }.freeze,
        T::Hash[Symbol, T.untyped]
      )

      # role=menu + popover=auto(light dismiss)。位置合わせはコントローラが行う
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "menu"
        attributes[:popover] = "auto"
        attributes[:tabindex] = "-1"
        merge_floating_position_data(attributes, state: "closed")
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
      # role=menuitem。data-highlighted と tabindex はコントローラが管理する
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "menuitem"
        attributes[:tabindex] = "-1"
        merge_nested(attributes, :data, { action: default_action })
        attributes
      end

      private

      sig { returns(String) }
      def default_action
        "#{DropdownMenu::CONTROLLER}#activate"
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

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([indicator, content])
        end
      end

      private

      # upstream の ItemIndicator + CheckIcon(契約スロット dropdown-menu-checkbox-item-indicator)。
      # indicator スロットを持たない派生(context-menu / menubar)は data-slot 無しで描く
      sig { returns(String) }
      def indicator
        options = { class: indicator_class }
        options[:data] = { slot: indicator_slot_name } if indicator_slot_name
        content_tag(:span, **options) do
          @checked ? check_icon : "".html_safe
        end
      end

      # 契約に indicator スロットが無い派生では nil を返す
      sig { returns(T.nilable(String)) }
      def indicator_slot_name
        "dropdown-menu-checkbox-item-indicator"
      end

      sig { returns(T.nilable(String)) }
      def indicator_class
        slot_name = indicator_slot_name
        return nil unless slot_name

        T.cast(contract_slot(slot_name).dig(:static_attributes, :class), T.nilable(String))
      end

      sig { returns(String) }
      def check_icon
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          width: "14",
          height: "14",
          class: "size-3.5"
        ) do
          raw(%(<path d="M20 6 9 17l-5-5"/>))
        end
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
        attributes = super
        attributes[:role] = "menuitemradio"
        attributes
      end

      private

      sig { returns(T.nilable(String)) }
      def indicator_slot_name
        "dropdown-menu-radio-item-indicator"
      end

      # ラジオはドット表示
      sig { returns(String) }
      def indicator
        content_tag(:span, class: indicator_class, data: { slot: indicator_slot_name }) do
          @checked ? content_tag(:span, class: "size-2 rounded-full bg-current") { "".html_safe } : "".html_safe
        end
      end
    end

    class Separator < BaseComponent
      # div(契約タグ SeparatorPrimitive は div 相当)
    end

    class Shortcut < BaseComponent
      # span
    end

    class Sub < BaseComponent
      # ネストしたサブメニューのスコープ。データ属性のみで構造を持つ
    end

    class SubTrigger < Item
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        merge_nested(attributes, :aria, { haspopup: "menu", expanded: "false" })
        attributes
      end

      private

      sig { override.returns(String) }
      def default_action
        "click->#{DropdownMenu::CONTROLLER}#toggleSub"
      end
    end

    class SubContent < Content
      FLOATING_POSITION_DEFAULTS = T.let(
        { side: :right, align: :start, side_offset: 0, align_offset: -3, collision_padding: 5 }.freeze,
        T::Hash[Symbol, T.untyped]
      )

      # 親Contentと同じ popover=auto。ネストはコントローラが処理する
    end
  end
end
