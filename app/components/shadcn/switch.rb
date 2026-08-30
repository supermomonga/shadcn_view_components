# typed: strict
# frozen_string_literal: true

module Shadcn
  class Switch < BaseComponent
    include NativeCheckedState

    NATIVE_STATE_CLASS = "not-checked:bg-input dark:not-checked:bg-input/80 checked:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
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
    def initialize(size: self.class.property_default(:size), **args)
      @size = T.let(normalize_property(:size, size), String)
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
      # ネイティブチェックボックスのウィジェット描画(appearance:auto)はCSSの
      # 背景/角丸の上にOS標準の箱を塗る(dark時は白箱として視覚差になる)ため消す。
      # 契約の data-[state] 系背景クラスを素の要素に効かせるために必要
      attributes[:class] = [attributes[:class], "appearance-none", NATIVE_STATE_CLASS].compact.join(" ")
      merge_native_checked_state(attributes, checked: native_checked?(@html_args))
      void_tag("input", **attributes)
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
        "peer-checked:translate-x-[calc(100%-2px)] peer-not-checked:translate-x-0",
        "dark:peer-checked:bg-primary-foreground dark:peer-not-checked:bg-foreground transition-transform",
        size_class
      ].join(" ")
      content_tag(
        :span,
        data: { slot: "switch-thumb" }.merge(native_checked_data(checked: native_checked?(@html_args))),
        aria: { hidden: "true" },
        class: [thumb_class, decoration].compact.join(" ")
      ) { "".html_safe }
    end
  end
end
