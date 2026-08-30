# typed: strict
# frozen_string_literal: true

module Shadcn
  class ToggleGroup < BaseComponent
    # JS無効時フォールバック: Readable(選択状態は変わらないが内容の読み取りに支障無し)

    # 契約タグは ToggleGroupPrimitive.Root。排他制御は shadcn--toggle-group コントローラが担う
    CONTROLLER = "shadcn--toggle-group"

    # type: :single は常に1つのみ on(コントローラが排他処理)。spacing は --gap CSS変数。
    # variant/size は upstream と同じくグループの data 属性に出力する
    # (Item 側の装飾は group-data セレクタと Item 自身の data 属性で効く)
    sig do
      params(
        type: T.any(Symbol, String),
        spacing: T.any(Integer, Float, String),
        variant: T.nilable(T.any(Symbol, String)),
        size: T.nilable(T.any(Symbol, String)),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(type: self.class.property_default(:type),
                   spacing: self.class.property_default(:spacing), variant: nil, size: nil, **args)
      @group_type = T.let(normalize_property(:type, type), String)
      @spacing = T.let(normalize_property(:spacing, spacing), T.any(Integer, Float))
      # グループ自身の契約に軸は無いため、Item の許容値で検証する
      @group_variant = T.let(variant.nil? ? nil : normalize_group_option(variant, :variant), T.nilable(Symbol))
      @group_size = T.let(size.nil? ? nil : normalize_group_option(size, :size), T.nilable(Symbol))
      super(**args)
    end

    sig { returns(String) }
    attr_reader :group_type

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      attributes = super.merge(
        controller: CONTROLLER,
        type: @group_type
      )
      # upstream の Root と同じ data 属性(未指定のものは描かない)
      attributes[:variant] = @group_variant if @group_variant
      attributes[:size] = @group_size if @group_size
      attributes[:spacing] = @spacing.to_s
      attributes
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = super
      merge_style(attributes, { "--gap": @spacing.to_s })
      attributes
    end

    private

    # グループの variant/size を Item の許容値で fail-fast 検証する
    sig { params(value: T.untyped, prop: Symbol).returns(Symbol) }
    def normalize_group_option(value, prop)
      ShadcnViewComponents::Classes.normalize_option(:"toggle_group/item", prop, value)
    end

    class Item < BaseComponent
      # 契約タグは ToggleGroupPrimitive.Item。ネイティブな button として描く。
      # 開閉状態は親の shadcn--toggle-group コントローラが管理する(data-action で委譲)
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      # variant/size はupstreamではグループのcontextから受け取る。Ruby側では
      # 利用者が各Itemに指定する(規約: 省略時は契約の既定値)。
      # spacing はグループと同じ既定値2を使い、data属性に出力する
      sig do
        params(
          variant: T.any(Symbol, String),
          size: T.any(Symbol, String),
          state: T.any(Symbol, String),
          spacing: T.any(Integer, Float, String),
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(variant: ShadcnViewComponents::Contracts::ToggleGroup::Item::DEFAULTS.fetch(:variant),
                     size: ShadcnViewComponents::Contracts::ToggleGroup::Item::DEFAULTS.fetch(:size),
                     state: self.class.property_default(:state),
                     spacing: self.class.property_default(:spacing), **args)
        @variant = T.let(normalize_option(:variant, variant), Symbol)
        @size = T.let(normalize_option(:size, size), Symbol)
        @state = T.let(normalize_property(:state, state), String)
        @spacing = T.let(normalize_property(:spacing, spacing), T.any(Integer, Float))
        super(**args)
      end

      sig { returns(Symbol) }
      attr_reader :variant

      sig { returns(Symbol) }
      attr_reader :size

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { variant: @variant, size: @size }
      end

      # upstream の Item と同じ data 属性(spacing の角丸・枠線制御はここから効く)
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def contract_data_attributes
        super.merge(
          state: @state,
          variant: @variant,
          size: @size,
          spacing: @spacing.to_s,
          action: "#{ToggleGroup::CONTROLLER}#toggleItem"
        )
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        merge_nested(attributes, :aria, { pressed: (@state == "on").to_s })
        attributes[:type] = "button" unless @html_args.key?(:type) || attributes.key?(:type)
        attributes
      end
    end
  end
end
