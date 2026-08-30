# typed: strict
# frozen_string_literal: true

module Shadcn
  # ボタンを一括りにするコンテナ(Phase 4)
  class ButtonGroup < BaseComponent
    sig { params(orientation: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(orientation: ShadcnViewComponents::Contracts::ButtonGroup::DEFAULTS.fetch(:orientation), **args)
      @orientation = T.let(normalize_option(:orientation, orientation), Symbol)
      super(**args)
    end

    sig { override.returns(T::Hash[Symbol, VariantOption]) }
    def variant_options
      { orientation: @orientation }
    end

    class Separator < BaseComponent
      # div(契約クラスは upstream の separator 上書き分を事前解決したもの)
      sig { params(orientation: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(orientation: :vertical, **args)
        value = orientation.to_s
        raise ArgumentError, "unknown orientation value #{orientation.inspect} (valid: :horizontal, :vertical)" unless %w[horizontal vertical].include?(value)

        @orientation = T.let(value, String)
        super(**args)
      end

      sig { override.returns(String) }
      def call
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
        merge_nested(attributes, :data, { slot: "button-group-separator" })
        render(Shadcn::Separator.new(orientation: @orientation, **attributes))
      end
    end

    class Text < BaseComponent
      # div
    end
  end
end
