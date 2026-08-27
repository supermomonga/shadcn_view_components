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
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { slot: "hover-card-content", state: "closed", action: "mouseenter->#{CONTROLLER}#show mouseleave->#{CONTROLLER}#hide" }.merge(data)
        attributes[:hidden] = true
        attributes
      end
    end
  end
end
