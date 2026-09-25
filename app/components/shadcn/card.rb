# typed: strict
# frozen_string_literal: true

module Shadcn
  class Card < BaseComponent
    sig { params(size: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(size: self.class.property_default(:size), **args)
      @size = T.let(normalize_property(:size, size), String)
      super(**args)
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(size: @size)
    end

    class Header < BaseComponent; end

    class Title < BaseComponent; end

    class Description < BaseComponent; end

    class Action < BaseComponent; end

    class Content < BaseComponent; end

    class Footer < BaseComponent; end
  end
end
