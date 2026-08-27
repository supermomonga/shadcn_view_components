# typed: strict
# frozen_string_literal: true

module Shadcn
  class Label < BaseComponent
    # 契約タグは LabelPrimitive.Root。ネイティブな label 要素として描画する
    sig { override.returns(String) }
    def default_tag
      "label"
    end
  end
end
