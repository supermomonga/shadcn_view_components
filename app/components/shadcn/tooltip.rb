# typed: strict
# frozen_string_literal: true

module Shadcn
  # 遅延制御付きツールチップ(05 §3「tooltip = Popover API + 遅延制御」)。
  # JS無効時フォールバック: Readable(本文はSSR済み)
  class Tooltip < BaseComponent
    CONTROLLER = "shadcn--tooltip"

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(controller: CONTROLLER)
    end

    class Provider < BaseComponent
      # delayDuration の既定は 0(upstream と同じ)
    end

    class Trigger < BaseComponent
      include Shadcn::ButtonStyled

      # 契約タグは TooltipPrimitive.Trigger(HTML名ではない)だが、upstream の
      # トリガーは button 要素として描かれるため button にフォールバックさせる
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = apply_button_styling(super)
        attributes[:type] = "button" unless attributes.key?(:type)
        merge_nested(attributes, :data, {
                       action: "mouseenter->#{CONTROLLER}#show mouseleave->#{CONTROLLER}#hide focus->#{CONTROLLER}#show blur->#{CONTROLLER}#hide"
                     })
        attributes
      end
    end

    class Content < BaseComponent
      # 契約スロット構成: tooltip-content(arrow は data-slot を持たない装飾要素)
      sig { override.returns(String) }
      def call
        content_tag(:div, **content_attributes) do
          safe_join([content.presence, arrow])
        end
      end

      private

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def content_attributes
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { slot: "tooltip-content", state: "closed" }.merge(data)
        attributes[:role] = "tooltip"
        attributes[:hidden] = true
        attributes
      end

      # upstream の Arrow(静的クラスは契約スロット外の直書き)
      sig { returns(String) }
      def arrow
        content_tag(:div, class: "z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground") { "".html_safe }
      end
    end
  end
end
