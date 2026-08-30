# typed: strict
# frozen_string_literal: true

module Shadcn
  class Avatar < BaseComponent
    # 契約タグは AvatarPrimitive.Root。ネイティブな span として描画する
    sig { override.returns(String) }
    def default_tag
      "span"
    end

    # upstream は size(default/sm/lg)を data-size 属性として描画する(クラスはdata-[size]セレクタで参照)
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

    class Image < BaseComponent
      # 契約タグは AvatarPrimitive.Image。ネイティブな img として描画する(void要素)
      sig { override.returns(String) }
      def default_tag
        "img"
      end
    end

    class Fallback < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "span"
      end
    end

    class Badge < BaseComponent
    end

    class Group < BaseComponent
      class Count < BaseComponent
      end
    end
  end
end
