# typed: strict
# frozen_string_literal: true

module Shadcn
  class Skeleton < BaseComponent
    # BaseComponent の rest-kwargs initialize を再宣言する(srb の静的モデルが
    # 継承した **args を誤バインドするため — 他コンポーネントと同じ定形)
    sig { params(args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(**args)
      super
    end
  end
end
