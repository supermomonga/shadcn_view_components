# typed: strict
# frozen_string_literal: true

module Shadcn
  # hover intent 付きのホバーカード(05 §3「hover-card = Popover API + hover intent」)。
  # JS無効時フォールバック: Readable(内容はSSR済みで読める。展開はJS依存)
  class HoverCard < BaseComponent
    CONTROLLER = "shadcn--hover-card"

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(controller: CONTROLLER)
    end

    class Trigger < BaseComponent
      # 契約タグは HoverCardPrimitive.Trigger(HTML名ではない)。upstream の慣行は
      # <a>(href を渡した場合)なので、href の有無でリンクかボタンかに切り替える
      sig { override.returns(String) }
      def default_tag
        @html_args.key?(:href) ? "a" : "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        merge_nested(attributes, :data, {
                       action: "mouseenter->#{CONTROLLER}#show mouseleave->#{CONTROLLER}#hide focus->#{CONTROLLER}#show blur->#{CONTROLLER}#hide"
                     })
        attributes
      end
    end

    class Content < BaseComponent
      include Shadcn::FloatingPositionOptions

      FLOATING_POSITION_DEFAULTS = T.let(
        { side: :bottom, align: :center, side_offset: 4, align_offset: 4, collision_padding: 5 }.freeze,
        T::Hash[Symbol, T.untyped]
      )

      # 契約スロット構成: hover-card-portal(ラッパー) > hover-card-content。
      # 表示切替は hidden 属性 + data-state で行う
      sig { override.returns(String) }
      def call
        content_tag(:div, data: { slot: "hover-card-portal" }) do
          content_tag(:div, **content_attributes) { content }
        end
      end

      private

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def content_attributes
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
        merge_floating_position_data(
          attributes,
          slot: "hover-card-content",
          state: "closed",
          action: "mouseenter->#{CONTROLLER}#show mouseleave->#{CONTROLLER}#hide"
        )
        attributes[:hidden] = true
        attributes
      end
    end
  end
end
