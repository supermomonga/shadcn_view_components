# typed: strict
# frozen_string_literal: true

module Shadcn
  class Checkbox < BaseComponent
    # 契約タグは CheckboxPrimitive.Root。ネイティブな input[type=checkbox] として描く
    # (JS無しで動作 — 05-stimulus-hotwire §3「checkbox = input + CSS」)。
    # base-nova の契約クラスは data-checked / data-unchecked(属性の存在)を参照する。
    # checked 属性(利用者指定)の有無から導出して素のinputでも発火させる
    sig { override.returns(String) }
    def default_tag
      "input"
    end

    sig { override.returns(String) }
    def call
      safe_join([input_element, indicator_element])
    end

    private

    sig { returns(T::Hash[Symbol, T.untyped]) }
    def state_attributes
      @html_args[:checked] ? { checked: "" } : { unchecked: "" }
    end

    sig { returns(String) }
    def input_element
      attributes = html_attributes.merge(type: "checkbox")
      # ネイティブウィジェット描画(appearance:auto)はCSSの背景の上にOS標準の箱を
      # 塗る(dark時は白箱として視覚差になる)ため消す
      attributes[:class] = [attributes[:class], "appearance-none"].compact.join(" ")
      merge_nested(attributes, :data, state_attributes)
      content_tag(:input, **attributes) { "".html_safe }
        .then { |markup| markup.sub(%r{></input>\z}, ">") }
        .then(&:html_safe)
    end

    # 契約のスロット構造(checkbox-indicator)を保つ。普段は非表示で、
    # peer であるinputのチェック状態に連動して出す(upstreamのIndicatorと同じ挙動)
    sig { returns(String) }
    def indicator_element
      contract_class = T.cast(contract_slot("checkbox-indicator").dig(:static_attributes, :class), T.nilable(String))
      content_tag(:span, data: { slot: "checkbox-indicator" }, class: [contract_class, "hidden peer-checked:grid"].compact.join(" ")) do
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          class: "size-3.5"
        ) do
          raw(%(<path d="M20 6 9 17l-5-5"/>))
        end
      end
    end
  end
end
