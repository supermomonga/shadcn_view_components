# typed: strict
# frozen_string_literal: true

module Shadcn
  # Popover API によるポップオーバー(10-roadmap Phase 3「popover = Popover API」)。
  # popover="auto" で軽量な外側クリック解散をネイティブに任せ、コントローラは
  # 開閉同期と位置合わせ(anchor相当)を担う
  # JS無効時フォールバック: Readable(展開はできないが本文はSSR済み)
  class Popover < BaseComponent
    CONTROLLER = "shadcn--popover"

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(controller: CONTROLLER)
    end

    class Trigger < BaseComponent
      include Shadcn::ButtonStyled

      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = apply_button_styling(super)
        attributes[:type] = "button" unless attributes.key?(:type)
        merge_nested(attributes, :aria, { expanded: "false", haspopup: "true" })
        merge_nested(attributes, :data, { action: "#{CONTROLLER}#toggle" })
        attributes
      end
    end

    # base-nova では Anchor が廃止されたため非対応(位置決めはTrigger基準)

    class Content < BaseComponent
      include Shadcn::FloatingPositionOptions

      FLOATING_POSITION_DEFAULTS = T.let(
        { side: :bottom, align: :center, side_offset: 4, align_offset: 0, collision_padding: 5 }.freeze,
        T::Hash[Symbol, T.untyped]
      )

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:popover] = "auto"
        merge_floating_position_data(attributes, state: "closed")
      end
    end

    class Header < BaseComponent
      # div
    end

    class Title < BaseComponent
      # div(契約タグは h2 の型注記だが実要素は div)
    end

    class Description < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "p"
      end
    end
  end
end
