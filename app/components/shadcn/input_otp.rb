# typed: strict
# frozen_string_literal: true

module Shadcn
  # ワンタイムパスコード入力(10-roadmap Phase 4「JS必須」分類)。
  # 素の input(autofocus + inputmode)を用い、桁の見た目は Slot/Group で表す
  class InputOTP < BaseComponent
    sig do
      params(
        length: T.any(Integer, String),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(length: self.class.property_default(:length), **args)
      @length = T.let(normalize_property(:length, length), Integer)
      super(**args)
    end

    sig { override.returns(String) }
    def default_tag
      "input"
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = super
      attributes[:type] = "text" unless attributes.key?(:type)
      attributes[:inputmode] = "numeric"
      attributes[:maxlength] = @length
      attributes[:autocomplete] = "one-time-code"
      attributes
    end

    class Group < BaseComponent
      # div
    end

    class Slot < BaseComponent
      # div(1桁分の枠)
    end

    class Separator < BaseComponent
      # div(-)。契約静的クラスは自動付与
    end
  end
end
