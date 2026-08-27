# typed: strict
# frozen_string_literal: true

module Shadcn
  class Toggle < BaseComponent
    # 契約タグは TogglePrimitive.Root。button + data-state + 小コントローラ
    # (shadcn--toggle)で開閉する(05-stimulus-hotwire §3「toggle = button + data-state」)
    CONTROLLER = "shadcn--toggle"

    # 契約タグは TogglePrimitive.Root。ネイティブな button として描く
    sig { override.returns(String) }
    def default_tag
      "button"
    end

    # state(on/off)は初期状態。以降はコントローラが data-state / aria-pressed を書き換える
    sig do
      params(
        variant: T.any(Symbol, String),
        size: T.any(Symbol, String),
        state: T.any(Symbol, String),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(variant: ShadcnViewComponents::Contracts::Toggle::DEFAULTS.fetch(:variant),
                   size: ShadcnViewComponents::Contracts::Toggle::DEFAULTS.fetch(:size),
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

    sig { returns(String) }
    attr_reader :state

    sig { override.returns(T::Hash[Symbol, VariantOption]) }
    def variant_options
      { variant: @variant, size: @size }
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(
        controller: CONTROLLER,
        state: @state,
        action: "#{CONTROLLER}#toggle"
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
