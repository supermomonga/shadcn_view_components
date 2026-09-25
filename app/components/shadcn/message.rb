# typed: strict
# frozen_string_literal: true

module Shadcn
  # AIチャット等のメッセージ行(Phase 4)。静的な表示構造
  class Message < BaseComponent
    sig { params(align: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(align: self.class.property_default(:align), **args)
      @align = T.let(normalize_property(:align, align), String)
      super(**args)
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(align: @align)
    end

    class Group < BaseComponent
      # div
    end

    class Avatar < BaseComponent
      # div
    end

    class Content < BaseComponent
      # div
    end

    class Footer < BaseComponent
      # div
    end

    class Header < BaseComponent
      # div
    end
  end
end
