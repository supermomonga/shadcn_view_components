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
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
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
      # role=menu + popover=auto(light dismiss)。位置合わせはコントローラが行う
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
      # role=menuitem。data-highlighted と tabindex はコントローラが管理する
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "menuitem"
        attributes[:tabindex] = "-1"
        merge_nested(attributes, :data, { action: "#{DropdownMenu::CONTROLLER}#activate" })
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

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([indicator, content])
        end
      end

      private

      # upstream の ItemIndicator + CheckIcon(data-slot を持たない装飾)
      sig { returns(String) }
      def indicator
        content_tag(:span, class: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center") do
          return "".html_safe unless @checked

          check_icon
        end
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

      # ラジオはドット表示
      sig { returns(String) }
      def indicator
        content_tag(:span, class: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center") do
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
        merge_nested(attributes, :data, { action: "#{DropdownMenu::CONTROLLER}#toggleSub" })
        attributes
      end
    end

    class SubContent < Content
      # 親Contentと同じ popover=auto。ネストはコントローラが処理する
    end
  end
end
