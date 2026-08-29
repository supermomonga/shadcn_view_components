# typed: strict
# frozen_string_literal: true

module Shadcn
  class Input < BaseComponent
    # input タグ・クラス・data-slot は契約由来。type 等の属性はパススルー。
    # base-nova の契約タグは InputPrimitive のため HTML input を明示する
    sig { override.returns(String) }
    def default_tag
      "input"
    end
  end
end
