# typed: strict
# frozen_string_literal: true

module Shadcn
  class Separator < BaseComponent
    # 契約タグは SeparatorPrimitive.Root。ネイティブな div(装飾区切り線)として描画する
    sig { override.returns(String) }
    def default_tag
      "div"
    end

    # upstream は orientation / decorative を動的属性として持つ(規定 horizontal / true)
    sig do
      params(
        orientation: T.any(Symbol, String),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(orientation: "horizontal", **args)
      @orientation = T.let(orientation.to_s, String)
      super(**args)
    end

    sig { returns(String) }
    attr_reader :orientation

    # ネイティブ要素化に伴う追加属性(05-stimulus-hotwire §3 の方針。
    # 適合試験は spec/conformance/allowances.yml でこれらを明示的に許可する)
    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(orientation: @orientation)
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = super
      merge_nested(attributes, :aria, { orientation: @orientation })
      attributes[:role] = "separator" unless @html_args.key?(:role)
      attributes
    end
  end
end
