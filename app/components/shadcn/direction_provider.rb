# typed: strict
# frozen_string_literal: true

module Shadcn
  # 書字方向スコープ。div[dir] で括るだけ(Radix DirectionProvider 相当の役割)
  class DirectionProvider < BaseComponent
    sig { params(dir: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(dir: "ltr", **args)
      @dir = T.let(dir.to_s, String)
      super(**args)
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      super.tap { |attributes| attributes[:dir] = @dir }
    end
  end
end
