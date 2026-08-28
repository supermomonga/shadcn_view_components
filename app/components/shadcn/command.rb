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
      # 契約スロット構成: command-input-wrapper(div) > command-input(input)
      sig { override.returns(String) }
      def default_tag
        "div"
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([search_icon, input_element])
        end
      end

      private

      sig { returns(String) }
      def input_element
        void_input(
          type: "search",
          class: self.class.classes,
          data: { slot: "command-input", action: "input->#{Command::CONTROLLER}#filter keydown->#{Command::CONTROLLER}#navigate" },
          aria: { label: "コマンド検索" }
        )
      end

      # void要素(input)を閉じタグ無しで出力する
      sig { params(attrs: T::Hash[Symbol, T.untyped]).returns(String) }
      def void_input(attrs)
        content_tag(:input, **attrs) { "".html_safe }
          .then { |markup| markup.sub(%r{</input>\z}, "") }
          .then(&:html_safe)
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
          width: "16",
          height: "16",
          class: "size-4",
          aria: { hidden: "true" }
        ) do
          raw(%(<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>))
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
