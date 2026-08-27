# typed: strict
# frozen_string_literal: true

module Shadcn
  class Checkbox < BaseComponent
    # 契約タグは CheckboxPrimitive.Root。ネイティブな input[type=checkbox] として描く
    # (JS無しで動作 — 05-stimulus-hotwire §3「checkbox = input + CSS」)。
    # 契約の data-[state=checked]:* クラスは Radix の data-state 由来のため、ネイティブ
    # inputでは素のチェック印が表示される(data-state同期はPhase 2後半の改良枠)
    sig { override.returns(String) }
    def default_tag
      "input"
    end

    sig { override.returns(String) }
    def call
      safe_join([input_element, indicator_element])
    end

    private

    sig { returns(String) }
    def input_element
      attributes = html_attributes.merge(type: "checkbox")
      content_tag(:input, **attributes) { "".html_safe }
        .then { |markup| markup.sub(%r{></input>\z}, ">") }
        .then(&:html_safe)
    end

    # 契約のスロット構造(checkbox-indicator)を保つ。表示は素のinputのチェック印が担うため隠す
    sig { returns(String) }
    def indicator_element
      contract_class = T.cast(contract_slot("checkbox-indicator").dig(:static_attributes, :class), T.nilable(String))
      content_tag(:span, data: { slot: "checkbox-indicator" }, class: [contract_class, "hidden"].compact.join(" ")) do
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
