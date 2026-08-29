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

    # base-nova の契約クラスは data-checked / data-unchecked(属性の存在)を参照する
    # (bg-primary / bg-input / ツマミ背景等)。checked 属性(利用者指定)の有無から
    # 導出して両要素に付与する
    sig { returns(T::Hash[Symbol, T.untyped]) }
    def state_attributes
      @html_args[:checked] ? { checked: "" } : { unchecked: "" }
    end

    sig { returns(String) }
    def input_element
      attributes = html_attributes.merge(type: "checkbox", role: "switch")
      # ネイティブチェックボックスのウィジェット描画(appearance:auto)はCSSの
      # 背景/角丸の上にOS標準の箱を塗る(dark時は白箱として視覚差になる)ため消す。
      # 契約の data-[state] 系背景クラスを素の要素に効かせるために必要
      attributes[:class] = [attributes[:class], "appearance-none"].compact.join(" ")
      merge_nested(attributes, :data, state_attributes)
      content_tag(:input, **attributes) { "".html_safe }
        .then { |markup| markup.sub(%r{></input>\z}, ">") }
        .then(&:html_safe)
    end

    sig { returns(String) }
    def thumb_element
      thumb_class = T.cast(contract_slot("switch-thumb").dig(:static_attributes, :class), T.nilable(String))
      # 契約のツマミサイズ(group-data-[size]/switch:size-*)はルートをgroupとする
      # 子孫向けユーティリティのため、ネイティブinput構成ではツマミが兄弟になるので
      # 発火しない。sizeはコンポーネント側で明示する(契約のdata-size値と同じ)
      size_class = @size == "sm" ? "size-3" : "size-4"
      decoration = [
        "pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2 translate-x-0",
        "peer-checked:translate-x-[calc(100%-2px)] transition-transform",
        size_class
      ].join(" ")
      content_tag(
        :span,
        data: { slot: "switch-thumb" }.merge(state_attributes),
        class: [thumb_class, decoration].compact.join(" ")
      ) { "".html_safe }
    end
  end
end
