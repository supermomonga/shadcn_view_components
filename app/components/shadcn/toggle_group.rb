# typed: strict
# frozen_string_literal: true

module Shadcn
  class ToggleGroup < BaseComponent
    # 契約タグは ToggleGroupPrimitive.Root。排他制御は shadcn--toggle-group コントローラが担う
    CONTROLLER = "shadcn--toggle-group"

    # type: :single は常に1つのみ on(コントローラが排他処理)。spacing は --gap CSS変数
    sig do
      params(
        type: T.any(Symbol, String),
        spacing: T.any(Integer, Float),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(type: :multiple, spacing: 0, **args)
      @group_type = T.let(type.to_s, String)
      @spacing = spacing
      super(**args)
    end

    sig { returns(String) }
    attr_reader :group_type

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(
        controller: CONTROLLER,
        type: @group_type
      )
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = super
      user_style = T.cast(attributes[:style], T.nilable(T::Hash[Symbol, T.untyped]))
      attributes[:style] = { "--gap": @spacing.to_s }.merge(user_style || {})
      attributes
    end

    class Item < BaseComponent
      # 契約タグは ToggleGroupPrimitive.Item。ネイティブな button として描く。
      # 開閉状態は親の shadcn--toggle-group コントローラが管理する(data-action で委譲)
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      # variant/size はupstreamではグループのcontextから受け取る。Ruby側では
      # 利用者が各Itemに指定する(規約: 省略時は契約の既定値)
      sig do
        params(
          variant: T.any(Symbol, String),
          size: T.any(Symbol, String),
          state: T.any(Symbol, String),
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(variant: ShadcnViewComponents::Contracts::ToggleGroup::Item::DEFAULTS.fetch(:variant),
                     size: ShadcnViewComponents::Contracts::ToggleGroup::Item::DEFAULTS.fetch(:size),
                     state: :off, **args)
        @variant = T.let(normalize_option(:variant, variant), Symbol)
        @size = T.let(normalize_option(:size, size), Symbol)
        @state = T.let(state.to_s, String)
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

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def contract_data_attributes
        super.merge(
          state: @state,
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
