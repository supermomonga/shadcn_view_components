# typed: strict
# frozen_string_literal: true

module Shadcn
  # コマンドパレット(10-roadmap Phase 3「command = ARIA combobox/listbox + フィルタlib」)。
  # SSR済みリストを入力でフィルタする(command_controller)。情報はJSで構築しない
  # JS無効時フォールバック: Readable(全項目がSSR済み)
  class Command < BaseComponent
    CONTROLLER = "shadcn--command"

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(controller: CONTROLLER)
    end

    # upstream は Dialog + Command の合成。本gemでも同じ構成で再利用する
    class Dialog < BaseComponent
      sig { override.returns(String) }
      def call
        # 契約ルートは data-slot を持たない div(className="overflow-hidden p-0")。
        # dialog/command の開閉構造はその内側に置く
        content_tag(:div, class: self.class.classes(extra: @user_class)) do
          render(::Shadcn::Dialog.new) do
            render(::Shadcn::Dialog::Content.new) do
              render(::Shadcn::Command.new) { content }
            end
          end
        end
      end
    end

    class Input < BaseComponent
      # 契約スロット構成: command-input-wrapper(div) > command-input(input)。
      # upstream はさらに内側を <InputGroup>(別アイテム)でラップし、検索アイコンは
      # <InputGroupAddon align="inline-start"> に置く(そのため input が先・icon が後)
      sig { override.returns(String) }
      def default_tag
        "div"
      end

      sig do
        params(placeholder: T.nilable(String), args: T::Hash[Symbol, T.untyped]).void.checked(:never)
      end
      def initialize(placeholder: nil, **args)
        @placeholder = T.let(placeholder, T.nilable(String))
        super(**args)
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          render(Shadcn::InputGroup.new(**group_args)) do
            safe_join([input_element, addon_element])
          end
        end
      end

      private

      # upstream CommandInput の InputGroup への上書き(className)
      sig { returns(T::Hash[Symbol, T.untyped]) }
      def group_args
        { class: "h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! " \
                 "*:data-[slot=input-group-addon]:pl-2!" }
      end

      sig { returns(String) }
      def input_element
        # キーボード操作はコントローラのキャプチャリスナーで一元処理する(data-action に
        # keydown を置くと二重発火する — 片方のみにバインドする)
        void_tag(
          "input",
          type: "text",
          placeholder: @placeholder,
          autocomplete: "off",
          class: self.class.classes,
          data: { slot: "command-input", action: "input->#{Command::CONTROLLER}#filter" },
          aria: { label: "コマンド検索" }
        )
      end

      sig { returns(String) }
      def addon_element
        render(Shadcn::InputGroup::Addon.new(align: "inline-start")) do
          search_icon
        end
      end

      sig { returns(String) }
      def search_icon
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          class: "size-4 shrink-0 opacity-50",
          aria: { hidden: "true" }
        ) do
          raw(%(<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>))
        end
      end
    end

    class List < BaseComponent
      # div(フィルタ対象の親)
    end

    class Empty < BaseComponent
      # フィルタ結果が空のときだけ表示(コントローラが切替)
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.tap { |attributes| attributes[:hidden] = true }
      end
    end

    class Group < BaseComponent
      # div(見出しは利用者が content に含める)
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
        merge_nested(attributes, :data, { value: @value, selected: "false" }.compact)
        attributes
      end
    end

    class Separator < BaseComponent
      # div
    end

    class Shortcut < BaseComponent
      # span
    end
  end
end
