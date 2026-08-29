# typed: strict
# frozen_string_literal: true

module Shadcn
  # メニューバー(10-roadmap Phase 3「menubar = 横断」)。
  # 横並びのトリガー群がそれぞれメニューを開く — 挙動は dropdown-menu と同一のため
  # 実装は DropdownMenu を継承する(契約・data-slot は menubar 側の contract_path から
  # 各自の ShadcnViewComponents::Contracts::Menubar::* を参照する)
  # JS無効時フォールバック: Readable
  class Menubar < DropdownMenu
    class Menu < BaseComponent
      # トリガー+コンテンツのスコープ(div)
    end

    class Trigger < DropdownMenu::Trigger
      # dropdown-menu のトリガーと同一(click でトグル)
    end

    class Portal < DropdownMenu::Portal
      # 搬送のみの機能要素の実体化
    end

    class Content < DropdownMenu::Content
      # popover=auto の ARIA menu
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

    class SubContent < DropdownMenu::SubContent; end
  end
end
