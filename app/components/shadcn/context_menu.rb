# typed: strict
# frozen_string_literal: true

module Shadcn
  # 右クリックメニュー(10-roadmap Phase 3「context-menu = 同上(右クリック)」)。
  # 実装は DropdownMenu を継承し、差分のみを上書きする:
  # - Trigger は click ではなく contextmenu で showAt を呼ぶ
  # - Content は右クリックイベント列の途中で light dismiss されないよう popover=manual
  # JS無効時フォールバック: Readable
  class ContextMenu < DropdownMenu
    class Trigger < BaseComponent
      # 任意の領域を右クリック対象にできる非button要素。
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:tabindex] = "0" unless attributes.key?(:tabindex)
        merge_nested(attributes, :aria, { haspopup: "menu" })
        merge_nested(attributes, :data, { action: "contextmenu->#{DropdownMenu::CONTROLLER}#showAt" })
        attributes
      end
    end

    class Portal < DropdownMenu::Portal
      # 搬送のみの機能要素の実体化
    end

    class Content < DropdownMenu::Content
      FLOATING_POSITION_DEFAULTS = T.let(
        { side: :right, align: :start, side_offset: 0, align_offset: 4, collision_padding: 5 }.freeze,
        T::Hash[Symbol, T.untyped]
      )

      # 右クリックで開く際、イベント列の途中でlight dismissされないようmanualにする
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.tap { |attributes| attributes[:popover] = "manual" }
      end
    end

    class Group < DropdownMenu::Group; end

    class Label < DropdownMenu::Label; end

    class Item < DropdownMenu::Item; end

    class CheckboxItem < DropdownMenu::CheckboxItem
      # 契約に indicator スロットが無いため data-slot 無しで描く
      sig { returns(T.nilable(String)) }
      def indicator_slot_name
        nil
      end
    end

    class RadioGroup < DropdownMenu::RadioGroup; end

    class RadioItem < DropdownMenu::RadioItem
      # 契約に indicator スロットが無いため data-slot 無しで描く
      sig { returns(T.nilable(String)) }
      def indicator_slot_name
        nil
      end
    end

    class Separator < DropdownMenu::Separator; end

    class Shortcut < DropdownMenu::Shortcut; end

    class Sub < DropdownMenu::Sub; end

    class SubTrigger < DropdownMenu::SubTrigger; end

    class SubContent < DropdownMenu::SubContent
      FLOATING_POSITION_DEFAULTS = T.let(
        { side: :right, align: :start, side_offset: 0, align_offset: 4, collision_padding: 5 }.freeze,
        T::Hash[Symbol, T.untyped]
      )
    end
  end
end
