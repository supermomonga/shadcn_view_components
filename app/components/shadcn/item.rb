# typed: strict
# frozen_string_literal: true

module Shadcn
  class Item < BaseComponent
    sig do
      params(
        variant: T.any(Symbol, String),
        size: T.any(Symbol, String),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(variant: ShadcnViewComponents::Contracts::Item::DEFAULTS.fetch(:variant),
                   size: ShadcnViewComponents::Contracts::Item::DEFAULTS.fetch(:size), **args)
      @variant = T.let(normalize_option(:variant, variant), Symbol)
      @size = T.let(normalize_option(:size, size), Symbol)
      super(**args)
    end

    sig { returns(Symbol) }
    attr_reader :variant

    sig { returns(Symbol) }
    attr_reader :size

    sig { override.returns(T::Hash[Symbol, VariantOption]) }
    def variant_options
      { variant: @variant, size: @size }
    end

    class Media < BaseComponent
      sig do
        params(
          variant: T.any(Symbol, String),
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(variant: ShadcnViewComponents::Contracts::Item::Media::DEFAULTS.fetch(:variant), **args)
        @variant = T.let(normalize_option(:variant, variant), Symbol)
        super(**args)
      end

      sig { returns(Symbol) }
      attr_reader :variant

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { variant: @variant }
      end
    end

    # upstream は Separator(別アイテム)をラップして "my-0" を重ねる構成。
    # 抽出器は単一アイテム内のクラスしか事前解決しないため、item側の契約には
    # "my-0" のみが記録される。描画は upstream のDOMと同じく Separator のクラス群 +
    # "my-0" とし、クラス検証は contains モードで行う(spec/conformance/allowances.yml 参照)
    class Separator < BaseComponent
      sig { override.returns(String) }
      def call
        content_tag(
          :div,
          role: "separator",
          data: { slot: contract_root_slot[:name], orientation: "horizontal" },
          aria: { orientation: "horizontal" },
          class: separator_class
        ) { content }
      end

      private

      sig { returns(String) }
      def separator_class
        Shadcn::Separator.classes(extra: @user_class ? "my-0 #{@user_class}" : "my-0")
      end
    end

    class Content < BaseComponent; end

    class Actions < BaseComponent; end

    class Group < BaseComponent; end

    class Title < BaseComponent; end

    class Description < BaseComponent; end

    class Header < BaseComponent; end

    class Footer < BaseComponent; end
  end
end
