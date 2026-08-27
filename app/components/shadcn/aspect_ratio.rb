# typed: strict
# frozen_string_literal: true

module Shadcn
  class AspectRatio < BaseComponent
    # 契約タグは AspectRatioPrimitive.Root。ネイティブな div + CSS aspect-ratio で描画する
    sig { override.returns(String) }
    def default_tag
      "div"
    end

    # upstream の ratio prop は style 経由でアスペクト比を指定する。ネイティブCSSで同等に再現
    sig do
      params(
        ratio: T.nilable(T.any(Integer, Float, String)),
        args: T::Hash[Symbol, T.untyped]
      ).void
    end
    def initialize(ratio: nil, **args)
      @ratio = ratio
      super(**args)
    end

    sig { returns(T.nilable(T.any(Integer, Float, String))) }
    attr_reader :ratio

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = super
      if @ratio
        user_style = T.cast(attributes[:style], T.nilable(T::Hash[Symbol, T.untyped]))
        attributes[:style] = { aspect_ratio: @ratio.to_s }.merge(user_style || {})
      end
      attributes
    end
  end
end
