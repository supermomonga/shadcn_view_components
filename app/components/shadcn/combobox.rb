# typed: strict
# frozen_string_literal: true

module Shadcn
  # コンボボックス(10-roadmap Phase 3「combobox = command + popover の合成」)。
  # upstream は input-group と組むが、本gemでは Input + Popover API リストで構成する
  # (契約クラス・data-slot は upstream 由来。input-group 側クラスは含まれない)
  # JS無効時フォールバック: JS必須(項目はSSR済みで読める。絞り込みはJS依存)
  class Combobox < BaseComponent
    CONTROLLER = "shadcn--command"

    # upstream の Combobox ルートは描画物を持たない(コンテキストのみ)ため契約は無い。
    # 本gemではトリガー入力とリストを同じコントローラスコープに置くラッパーとして描く
    sig { override.returns(String) }
    def call
      attributes = @html_args.merge(class: @user_class)
      data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
      attributes[:data] = { controller: CONTROLLER }.merge(data)
      content_tag(:div, **attributes) { content }
    end

    class Input < BaseComponent
      # 契約スロット構成: input-group-button(トリガーアイコン)のみ。
      # 検索inputは data-slot を持たない(role=combobox で識別する)
      sig { override.returns(String) }
      def default_tag
        "div"
      end

      # upstream は <InputGroup className="w-auto"> でラップするため、
      # ラッパのクラスは input-group の契約クラスを土台に組む。
      # placeholder は内側の検索inputに移す(ラッパのdivには意味が無い)
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:class] = ShadcnViewComponents::Classes.resolve(:input_group, extra: attributes[:class].to_s)
        @input_placeholder = T.let(attributes.delete(:placeholder), T.untyped)
        attributes
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([search_input, trigger_addon])
        end
      end

      private

      sig { returns(String) }
      def search_input
        # キーボード操作はコントローラのキャプチャリスナーで一元処理する(二重発火防止)。
        # クラスは upstream と同じ構成: Input の契約クラス + input-group-control の上書き
        base = ShadcnViewComponents::Classes.resolve(:input)
        overlay = input_group_combination("Input", {})
        void_tag(
          "input",
          type: "search",
          class: ShadcnViewComponents::Classes::MERGER.merge("#{base} #{overlay}"),
          placeholder: T.cast(@input_placeholder, T.nilable(String)),
          role: "combobox",
          aria: { expanded: "false", haspopup: "listbox" },
          data: { action: "input->#{Combobox::CONTROLLER}#filter" }
        )
      end

      # upstream の <InputGroupAddon align="inline-end">(トリガーを右端に置く)
      sig { returns(String) }
      def trigger_addon
        inline_end = { align: :"inline-end" }
        content_tag(:div, class: input_group_combination("Addon", inline_end), data: { slot: "input-group-addon" }) do
          trigger_button
        end
      end

      # 契約の input-group-button スロット。クラスは upstream と同じ構成で
      # Button(ghost) + input-group-button(icon-xs) + combobox側の上書きを重ねる
      sig { returns(String) }
      def trigger_button
        content_tag(
          :button,
          type: "button",
          class: trigger_class,
          data: { slot: "input-group-button", action: "#{Combobox::CONTROLLER}#toggleList" },
          aria: { label: "選択肢を開く" }
        ) { chevron_icon }
      end

      sig { returns(String) }
      def trigger_class
        # NOTE: Hashの値型は不変のため、Classes.resolve の options と同じ型で T.let する
        button_options = T.let({ variant: :ghost }, T::Hash[Symbol, T.nilable(T.any(Symbol, String))])
        button_base = ShadcnViewComponents::Classes.resolve(:button, extra: nil, **button_options)
        overlay = input_group_combination("Button", { size: :"icon-xs" })
        tail = T.cast(contract_slot("input-group-button").dig(:static_attributes, :class), T.nilable(String)).to_s
        ShadcnViewComponents::Classes::MERGER.merge([button_base, overlay, tail].join(" "))
      end

      # input-group 契約の各スロット組み合わせを引く
      sig { params(export: String, options: T::Hash[Symbol, T.untyped]).returns(String) }
      def input_group_combination(export, options = {})
        contract = ShadcnViewComponents::Contracts::InputGroup.const_get(export)
        defaults = T.cast(contract.const_get(:DEFAULTS), T::Hash[Symbol, Symbol])
        T.cast(T.unsafe(contract).combination(defaults.merge(options)), String)
      end

      sig { returns(String) }
      def chevron_icon
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
          raw(%(<path d="m6 9 6 6 6-6"/>))
        end
      end
    end

    class Trigger < BaseComponent
      # 開閉アイコン(chevron)。button として描く
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:type] = "button" unless attributes.key?(:type)
        merge_nested(attributes, :data, { action: "#{Combobox::CONTROLLER}#toggleList" })
        attributes
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) { chevron_icon }
      end

      private

      sig { returns(String) }
      def chevron_icon
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
          class: "pointer-events-none size-4 text-muted-foreground",
          aria: { hidden: "true" },
          data: { slot: "combobox-trigger-icon" }
        ) do
          raw(%(<path d="m6 9 6 6 6-6"/>))
        end
      end
    end

    class Content < BaseComponent
      # Popover API で開くリストボックス
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "listbox"
        attributes[:popover] = "auto"
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { state: "closed" }.merge(data)
        attributes
      end
    end

    class List < BaseComponent
      # div(絞り込み対象の親)
    end

    class Item < BaseComponent
      # 契約スロット構成: combobox-item + combobox-item-indicator(選択時のチェック)
      sig { params(value: T.nilable(String), selected: T::Boolean, args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(value: nil, selected: false, **args)
        @value = value
        @selected = selected
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "option"
        attributes[:tabindex] = "-1"
        merge_nested(attributes, :data, { value: @value, selected: @selected ? "true" : "false" }.compact)
        attributes
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([content, indicator])
        end
      end

      private

      sig { returns(String) }
      def indicator
        # 未選択時は HTML の hidden 属性で隠す(upstream の ItemIndicator と同じ挙動)
        content_tag(:span, data: { slot: "combobox-item-indicator" }, hidden: !@selected) do
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
          class: "size-4"
        ) do
          raw(%(<path d="M20 6 9 17l-5-5"/>))
        end
      end
    end

    class Group < BaseComponent
      # div
    end

    class Label < BaseComponent
      # div
    end

    class Empty < BaseComponent
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.tap { |attributes| attributes[:hidden] = true }
      end
    end

    class Separator < BaseComponent
      # div
    end

    class Collection < BaseComponent
      # 利用者が項目群を括るための汎用div
    end

    class Value < BaseComponent
      # 選択値の表示用span
    end

    class Chips < BaseComponent
      # チップ群のラッパー div
    end

    class Chip < BaseComponent
      # チップ + 取り除きボタン(契約スロット: combobox-chip / combobox-chip-remove)
      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([content, remove_button])
        end
      end

      private

      sig { returns(String) }
      def remove_button
        # upstream は <Button variant="ghost" size="icon-xs"> に
        # combobox 側の上書き(-ml-1 opacity-50 …)を重ねる
        options = T.let({ variant: :ghost, size: :"icon-xs" }, T::Hash[Symbol, T.nilable(T.any(Symbol, String))])
        base = ShadcnViewComponents::Classes.resolve(:button, extra: nil, **options)
        content_tag(
          :button,
          type: "button",
          class: ShadcnViewComponents::Classes::MERGER.merge("#{base} -ml-1 opacity-50 hover:opacity-100"),
          data: { slot: "combobox-chip-remove" },
          aria: { label: "削除" }
        ) { remove_icon }
      end

      sig { returns(String) }
      def remove_icon
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          width: "12",
          height: "12",
          class: "size-3",
          aria: { hidden: "true" }
        ) { raw(%(<path d="M18 6 6 18"/><path d="m6 6 12 12"/>)) }
      end
    end

    class ChipsInput < BaseComponent
      # チップ列の末尾にある検索input
      sig { override.returns(String) }
      def default_tag
        "input"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:type] = "text" unless attributes.key?(:type)
        attributes
      end
    end
  end
end
