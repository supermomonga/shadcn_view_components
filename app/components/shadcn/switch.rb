# typed: strict
# frozen_string_literal: true

module Shadcn
  class Switch < BaseComponent
    # 契約タグは SwitchPrimitive.Root。ネイティブな input[type=checkbox][role=switch] として
    # 描く(JS無しで動作 — 05-stimulus-hotwire §3)。ツマミは input の兄弟に置き、
    # peer-checked: で移動させる(契約の data-[state] ユーティリティを peer-checked 系に
    # キーし直した装飾を追加している)
    sig { override.returns(String) }
    def default_tag
      "input"
    end

    # upstream は size(default/sm)を data-size 属性として描画する
    sig do
      params(
        size: T.any(Symbol, String),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(size: "default", **args)
      @size = T.let(size.to_s, String)
      super(**args)
    end

    sig { returns(String) }
    attr_reader :size

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(size: @size)
    end

    sig { override.returns(String) }
    def call
      content_tag(:span, class: "relative inline-flex") do
        safe_join([input_element, thumb_element])
      end
    end

    private

    sig { returns(String) }
    def input_element
      attributes = html_attributes.merge(type: "checkbox", role: "switch")
      content_tag(:input, **attributes) { "".html_safe }
        .then { |markup| markup.sub(%r{></input>\z}, ">") }
        .then(&:html_safe)
    end

    sig { returns(String) }
    def thumb_element
      thumb_class = T.cast(contract_slot("switch-thumb").dig(:static_attributes, :class), T.nilable(String))
      decoration = [
        "pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2 translate-x-0",
        "peer-checked:translate-x-[calc(100%-2px)] transition-transform"
      ].join(" ")
      content_tag(
        :span,
        data: { slot: "switch-thumb" },
        class: [thumb_class, decoration].compact.join(" ")
      ) { "".html_safe }
    end
  end
end
