# typed: strict
# frozen_string_literal: true

module Shadcn
  # フィールドコンテナ(Phase 4)。orientation(vertical/horizontal/responsive)の
  # cva バリアントを持つ。Form と違い、こちらは説明・エラーの静的な配置構造
  class Field < BaseComponent
    sig { params(orientation: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(orientation: ShadcnViewComponents::Contracts::Field::DEFAULTS.fetch(:orientation), **args)
      @orientation = T.let(normalize_option(:orientation, orientation), Symbol)
      super(**args)
    end

    sig { override.returns(T::Hash[Symbol, VariantOption]) }
    def variant_options
      { orientation: @orientation }
    end

    class Content < BaseComponent
      # div
    end

    class Description < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "p"
      end
    end

    class Error < BaseComponent
      # div(契約静的クラスは自動付与)
    end

    class Group < BaseComponent
      # div
    end

    class Label < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "label"
      end
    end

    class Legend < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "legend"
      end
    end

    class Separator < BaseComponent
      # 契約スロット構成: field-separator > field-separator-content(span)
      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          content_tag(:span,
                      class: T.cast(contract_slot("field-separator-content").dig(:static_attributes, :class), T.nilable(String)),
                      data: { slot: "field-separator-content" }) { content }
        end
      end
    end

    class Set < BaseComponent
      # fieldset
      sig { override.returns(String) }
      def default_tag
        "fieldset"
      end
    end

    class Title < BaseComponent
      # div(契約の data-slot は field-label を共有する)
    end
  end
end
