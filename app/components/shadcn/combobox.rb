# typed: strict
# frozen_string_literal: true

module Shadcn
  module ComboboxValueNormalization
    extend T::Sig

    private

    sig { params(value: T.untyped, attribute: String).returns(String) }
    def normalize_form_value(value, attribute:)
      valid = value.is_a?(String) || value.is_a?(Symbol) || value.is_a?(Integer) || value.is_a?(Float)
      Kernel.raise ArgumentError, "#{attribute} must be a String, Symbol, Integer, or Float" unless valid

      value.to_s
    end
  end
  private_constant :ComboboxValueNormalization

  # 検索表示と確定したフォーム値を分離するコンボボックス。
  # upstream と同じ input-group の見た目を、Input + Popover API リストで構成する。
  # JS無効時フォールバック: JS必須(項目はSSR済みで読める。絞り込みはJS依存)
  class Combobox < BaseComponent
    CONTROLLER = "shadcn--combobox"
    FormValue = T.type_alias { T.any(String, Symbol, Integer, Float) }
    DefaultValue = T.type_alias { T.nilable(T.any(FormValue, T::Array[T.nilable(FormValue)])) }
    FORM_OWNED_ATTRIBUTES = %i[name form required disabled value multiple].freeze
    VISUALLY_HIDDEN_CONTROL_STYLE = "clip-path: inset(50%); overflow: hidden; white-space: nowrap; border: 0; " \
                                    "padding: 0; width: 1px; height: 1px; margin: -1px; position: absolute"

    include ComboboxValueNormalization

    private_constant :FormValue, :DefaultValue, :FORM_OWNED_ATTRIBUTES, :VISUALLY_HIDDEN_CONTROL_STYLE

    # ネイティブフォームと同じ公開keywordを列挙し、一つのHashへ隠さない。
    sig do
      params(
        name: T.nilable(T.any(String, Symbol)),
        default_value: DefaultValue,
        multiple: T::Boolean,
        disabled: T::Boolean,
        required: T::Boolean,
        form: T.nilable(T.any(String, Symbol)),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(name: nil, default_value: nil, multiple: false, disabled: false, required: false, form: nil, **args) # rubocop:disable Metrics/ParameterLists
      assign_accessibility_root_id(args, prefix: "combobox")
      @name = T.let(name&.to_s, T.nilable(String))
      @multiple = T.let(multiple, T::Boolean)
      @disabled = T.let(disabled, T::Boolean)
      @required = T.let(required, T::Boolean)
      @form = T.let(form&.to_s, T.nilable(String))
      @default_values = T.let(normalize_default_values(default_value), T::Array[String])
      @root_id = T.let(args[:id].to_s, String)
      super(**args)
    end

    # upstream の Combobox ルートは描画物を持たないprimitive aliasで、生成契約も
    # その空の契約面を記録する。本gemでは入力とリストを束ねるラッパーとして描く。
    sig { override.returns(String) }
    def call
      content_tag(:div, **root_attributes) { safe_join([content, form_control, empty_multiple_control]) }
    end

    private

    sig { returns(T::Hash[Symbol, T.untyped]) }
    def root_attributes
      attributes = @html_args.merge(class: @user_class, data: root_data_attributes)
      add_disabled_root_attributes(attributes) if @disabled
      attributes
    end

    sig { returns(T::Hash[Symbol, T.untyped]) }
    def root_data_attributes
      data = T.cast(@html_args[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
      { controller: CONTROLLER }.merge(data)
    end

    sig { params(attributes: T::Hash[Symbol, T.untyped]).void }
    def add_disabled_root_attributes(attributes)
      attributes[:inert] = true unless attributes.key?(:inert)
      aria = T.cast(attributes[:aria], T.nilable(T::Hash[Symbol, T.untyped])) || {}
      attributes[:aria] = { disabled: "true" }.merge(aria)
    end

    sig { params(default_value: DefaultValue).returns(T::Array[String]).checked(:never) }
    def normalize_default_values(default_value)
      values = @multiple ? multiple_default_values(default_value) : single_default_values(default_value)
      values.filter_map do |value|
        next if value.nil?

        normalized = normalize_form_value(value, attribute: "default_value")
        normalized unless normalized.strip.empty?
      end.uniq
    end

    sig { params(default_value: DefaultValue).returns(T::Array[T.nilable(FormValue)]).checked(:never) }
    def multiple_default_values(default_value)
      return [] if default_value.nil?

      raise ArgumentError, "default_value must be an Array when multiple is true" unless default_value.is_a?(Array)

      default_value
    end

    sig { params(default_value: DefaultValue).returns(T::Array[T.nilable(FormValue)]).checked(:never) }
    def single_default_values(default_value)
      raise ArgumentError, "default_value must be a scalar when multiple is false" if default_value.is_a?(Array)

      default_value.nil? ? [] : [default_value]
    end

    sig { returns(T::Hash[Symbol, T.untyped]) }
    def form_owned_attributes
      attributes = T.let({}, T::Hash[Symbol, T.untyped])
      attributes[:name] = @name if @name
      attributes[:form] = @form if @form
      attributes
    end

    sig { returns(String) }
    def empty_multiple_control
      return "" unless @multiple

      attributes = form_owned_attributes.merge(
        type: "hidden",
        value: "",
        disabled: @disabled || @default_values.any?,
        data: { slot: "combobox-empty-form-control" }
      )
      void_tag("input", **attributes)
    end

    sig { returns(String) }
    def form_control
      attributes = form_owned_attributes.merge(
        multiple: @multiple,
        disabled: @disabled,
        required: @required,
        tabindex: "-1",
        style: VISUALLY_HIDDEN_CONTROL_STYLE,
        aria: { hidden: "true" },
        data: { slot: "combobox-form-control", shadcn_generated_id: "true" }
      )
      attributes[:id] = "#{@root_id}-form-control"

      values = !@multiple && @default_values.empty? ? [""] : @default_values
      content_tag(:select, **attributes) do
        safe_join(values.map { |value| content_tag(:option, value:, selected: true) { value } })
      end
    end

    class Input < BaseComponent
      # 契約スロット構成: input-group-button(トリガーアイコン)のみ。
      # 検索inputは data-slot を持たない(role=combobox で識別する)
      sig { override.returns(String) }
      def default_tag
        "div"
      end

      sig { params(args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(**args)
        attribute = FORM_OWNED_ATTRIBUTES.find { |name| args.key?(name) }
        raise ArgumentError, "#{attribute} belongs to Shadcn::Combobox, not its query input" if attribute

        super
      end

      # upstream は <InputGroup className="w-auto"> でラップするため、
      # ラッパのクラスは input-group の契約クラスを土台に組む。
      # class は InputGroup ラッパー、その他のHTML属性は実際の検索inputへ渡す。
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        {
          class: ShadcnViewComponents::Classes.resolve(:input_group, extra: "w-auto #{@user_class}".strip)
        }
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
        attributes = @html_args.except(:tag, :class)
        attributes[:type] = "search" unless attributes.key?(:type)
        attributes[:class] = ShadcnViewComponents::Classes::MERGER.merge("#{base} #{overlay}")
        attributes[:role] = "combobox"
        merge_nested(
          attributes,
          :aria,
          { expanded: "false", haspopup: "listbox", autocomplete: "list", label: "候補を検索" }
        )
        merge_nested(attributes, :data, { action: "input->#{Combobox::CONTROLLER}#filter" })
        void_tag("input", **attributes)
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
          aria: { label: "選択肢を開く", haspopup: "listbox", expanded: "false" }
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
        merge_nested(attributes, :aria, { label: "選択肢を開く", haspopup: "listbox", expanded: "false" })
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
          aria: { hidden: "true" }
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
        attributes[:popover] = "manual"
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { state: "closed" }.merge(data)
        attributes
      end
    end

    class List < BaseComponent
      # div(絞り込み対象の親)
    end

    class Item < BaseComponent
      include ComboboxValueNormalization

      # base-nova の combobox-item に indicator スロットは無い(チェックは装飾要素)
      sig do
        params(
          value: FormValue,
          disabled: T::Boolean,
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(value:, disabled: false, **args)
        @value = T.let(normalize_form_value(value, attribute: "value"), String)
        raise ArgumentError, "value must not be blank" if @value.strip.empty?

        @disabled = T.let(disabled, T::Boolean)
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:role] = "option"
        attributes[:tabindex] = "-1"
        merge_nested(
          attributes,
          :aria,
          { selected: "false" }.merge(@disabled ? { disabled: "true" } : {})
        )
        # クリックでの選択確定。キー操作はコントローラのキャプチャリスナーで
        # 一元処理するため data-action にしない(二重発火防止)
        merge_nested(
          attributes,
          :data,
          {
            value: @value,
            selected: "false",
            action: "click->#{Combobox::CONTROLLER}#select"
          }.merge(@disabled ? { disabled: "" } : {})
        )
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
        # 未選択時は HTML の hidden 属性で隠す(upstream の ItemIndicator と同じ挙動)。
        # data-indicator は JS からの選択状態切替用(data-slot ではない)
        content_tag(:span, hidden: true, data: { indicator: "true" }) do
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
      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([content, chip_template])
        end
      end

      private

      sig { returns(String) }
      def chip_template
        content_tag(:template, data: { slot: "combobox-chip-template" }) do
          render(Chip.new(value: "__combobox_chip_template__")) { "__combobox_chip_label__" }
        end
      end
    end

    class Chip < BaseComponent
      include ComboboxValueNormalization

      # チップ + 取り除きボタン(契約スロット: combobox-chip / combobox-chip-remove)
      sig do
        params(
          value: FormValue,
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(value:, **args)
        @value = T.let(normalize_form_value(value, attribute: "value"), String)
        raise ArgumentError, "value must not be blank" if @value.strip.empty?

        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.tap { |attributes| merge_nested(attributes, :data, { value: @value }) }
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([content_tag(:span, data: { slot: "combobox-chip-label" }) { content }, remove_button])
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
          data: { slot: "combobox-chip-remove", action: "#{Combobox::CONTROLLER}#removeChip" },
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

      sig { params(args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(**args)
        attribute = FORM_OWNED_ATTRIBUTES.find { |name| args.key?(name) }
        raise ArgumentError, "#{attribute} belongs to Shadcn::Combobox, not its query input" if attribute

        super
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:type] = "text" unless attributes.key?(:type)
        attributes[:role] = "combobox"
        merge_nested(
          attributes,
          :aria,
          { expanded: "false", haspopup: "listbox", autocomplete: "list", label: "候補を検索" }
        )
        merge_nested(attributes, :data, { action: "input->#{Combobox::CONTROLLER}#filter" })
        attributes
      end
    end
  end
end
