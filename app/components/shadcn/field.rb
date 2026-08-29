# typed: strict
# frozen_string_literal: true

module Shadcn
  # フィールドコンテナ(Phase 4)。orientation(vertical/horizontal/responsive)の
  # cva バリアントを持つ。フォーム組み立て(upstream docs/forms ガイド)の基盤で、
  # Shadcn::Form::Item もこの構造の上に成り立つ
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

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = super
      # upstream は data-orientation={orientation} を常に出力する
      merge_nested(attributes, :data, { orientation: @orientation.to_s })
      attributes
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
      # div(契約静的クラスは自動付与)。upstream と同じく「本文が無ければ描かない」。
      # なお upstream の errors: 配列→ul リスト化は本クラスでは提供しない
      # (upstream の ul は data-slot を持たず field 契約に取込めないため。
      # 文字列配列を受けたい場合は Shadcn::Form::Error を使う)
      sig { override.returns(String) }
      def call
        body = content.to_s
        return "" if body.empty?

        content_tag(tag, **html_attributes) { body }
      end
    end

    class Group < BaseComponent
      # div
    end

    class Label < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "label"
      end

      # upstream の FieldLabel は <Label> プリミティブを描く: ラベル契約のクラスを
      # 土台に field 側のクラスを重ねる(cn(labelVariants(), fieldLabelClasses) と同じ順)。
      # 描画は label 契約のクラス群を含むため、適合試験は allowances の
      # class_mode: contains で緩和する
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:class] = ShadcnViewComponents::Classes.resolve(:label, extra: attributes[:class].to_s)
        attributes
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
