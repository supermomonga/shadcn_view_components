# typed: strict
# frozen_string_literal: true

module Shadcn
  class RadioGroup < BaseComponent
    # ネイティブなラジオボタン群(JS無しで動作 — 05-stimulus-hotwire §3)。
    # name は利用者が指定する(素のinputなのでそのまま連携する)
    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = super
      attributes[:role] = "radiogroup" unless @html_args.key?(:role)
      attributes
    end

    class Item < BaseComponent
      include NativeCheckedState

      NATIVE_STATE_CLASS = T.let([
        "not-checked:border-input not-checked:bg-transparent dark:not-checked:bg-input/30",
        "checked:border-primary checked:bg-primary checked:text-primary-foreground",
        "group-has-[:focus-visible]/field-label:checked:border-primary dark:checked:bg-primary"
      ].join(" ").freeze, String)

      # 契約タグは RadioGroupPrimitive.Item。ネイティブな input[type=radio] として描く
      sig { override.returns(String) }
      def default_tag
        "input"
      end

      sig { override.returns(String) }
      def call
        content_tag(:span, class: "relative flex w-fit") do
          safe_join([input_element, indicator_element])
        end
      end

      private

      sig { returns(String) }
      def input_element
        attributes = html_attributes.merge(type: "radio")
        # ネイティブウィジェット描画を消す(dark時の白箱問題 — checkbox.rb と同じ理由)。
        # 印の表示は indicator を peer-checked で出すため peer も付与する
        attributes[:class] = [attributes[:class], "appearance-none peer", NATIVE_STATE_CLASS].compact.join(" ")
        merge_native_checked_state(attributes, checked: native_checked?(@html_args))
        void_tag("input", **attributes)
      end

      # 契約のスロット構造(radio-group-indicator)を保つ。普段は非表示で、
      # peer であるinputのチェック状態に連動して出す(upstreamのIndicatorと同じ挙動)
      sig { returns(String) }
      def indicator_element
        indicator_class = T.cast(contract_slot("radio-group-indicator").dig(:static_attributes, :class), T.nilable(String))
        content_tag(
          :span,
          data: { slot: "radio-group-indicator" },
          aria: { hidden: "true" },
          class: [indicator_class, "pointer-events-none absolute inset-0 hidden peer-checked:flex"].compact.join(" ")
        ) do
          content_tag(
            :svg,
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "none",
            class: "absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 fill-current"
          ) do
            raw(%(<circle cx="12" cy="12" r="10"/>))
          end
        end
      end
    end
  end
end
