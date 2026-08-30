# typed: strict
# frozen_string_literal: true

module Shadcn
  # 入力要素の前後にボタンやテキストを並べるコンテナ(Phase 4)
  class InputGroup < BaseComponent
    # div(契約静的クラスは自動付与)

    class Addon < BaseComponent
      sig { params(align: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(align: ShadcnViewComponents::Contracts::InputGroup::Addon::DEFAULTS.fetch(:align), **args)
        @align = T.let(normalize_option(:align, align), Symbol)
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { align: @align }
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def contract_data_attributes
        super.merge(align: @align)
      end
    end

    class Input < BaseComponent
      # upstream は Input(別アイテム)に上書きクラスを足す
      sig { override.returns(String) }
      def call
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
        merge_nested(attributes, :data, { slot: "input-group-control" })
        render(::Shadcn::Input.new(**attributes)) { content }
      end
    end

    class Textarea < BaseComponent
      # upstream は Textarea(別アイテム)に上書きクラスを足す
      sig { override.returns(String) }
      def call
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
        merge_nested(attributes, :data, { slot: "input-group-control" })
        render(::Shadcn::Textarea.new(**attributes)) { content }
      end
    end

    class Text < BaseComponent
      # span(契約クラスのみ。data-slot は契約上ルートに無い)
    end
  end
end
