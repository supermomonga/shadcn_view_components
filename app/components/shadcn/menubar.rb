# typed: strict
# frozen_string_literal: true

module Shadcn
  # メニューバー(10-roadmap Phase 3「menubar = 横断」)。
  # 横並びのトリガー群と複数メニューをmenubar_controllerで一対一に管理する。
  # 部品の描画はDropdownMenuを継承するが、状態とキーボード操作は共有しない。
  # JS無効時フォールバック: Readable
  class Menubar < DropdownMenu
    CONTROLLER = "shadcn--menubar"

    module ControllerIdentifier
      extend T::Sig

      private

      sig { returns(String) }
      def controller_identifier
        Menubar::CONTROLLER
      end
    end

    private_constant :ControllerIdentifier

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(controller: CONTROLLER)
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = super
      attributes[:role] = "menubar"
      merge_nested(attributes, :aria, { orientation: "horizontal" })
      attributes
    end

    class Menu < BaseComponent
      # トリガー+コンテンツのスコープ(div)
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.tap { |attributes| attributes[:role] = "none" }
      end
    end

    class Trigger < DropdownMenu::Trigger
      include ControllerIdentifier

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.tap { |attributes| attributes[:role] = "menuitem" }
      end
    end

    class Portal < DropdownMenu::Portal
      # 搬送のみの機能要素の実体化
    end

    class Content < DropdownMenu::Content
      FLOATING_POSITION_DEFAULTS = T.let(
        { side: :bottom, align: :start, side_offset: 8, align_offset: -4, collision_padding: 5 }.freeze,
        T::Hash[Symbol, T.untyped]
      )

      # popover=auto の ARIA menu
    end

    class Group < DropdownMenu::Group; end

    class Label < DropdownMenu::Label; end

    class Item < DropdownMenu::Item
      include ControllerIdentifier
    end

    class CheckboxItem < DropdownMenu::CheckboxItem
      include ControllerIdentifier

      # 契約に indicator スロットが無いため data-slot 無しで描く
      sig { returns(T.nilable(String)) }
      def indicator_slot_name
        nil
      end
    end

    class RadioGroup < DropdownMenu::RadioGroup; end

    class RadioItem < DropdownMenu::RadioItem
      include ControllerIdentifier

      # 契約に indicator スロットが無いため data-slot 無しで描く
      sig { returns(T.nilable(String)) }
      def indicator_slot_name
        nil
      end
    end

    class Separator < DropdownMenu::Separator; end

    class Shortcut < DropdownMenu::Shortcut; end

    class Sub < DropdownMenu::Sub; end

    class SubTrigger < DropdownMenu::SubTrigger
      include ControllerIdentifier
    end

    class SubContent < DropdownMenu::SubContent; end
  end
end
