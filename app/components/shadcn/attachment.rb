# typed: strict
# frozen_string_literal: true

module Shadcn
  # 添付カード(Phase 4)。orientation/size のバリアントを持つ
  class Attachment < BaseComponent
    sig do
      params(
        orientation: T.any(Symbol, String),
        size: T.any(Symbol, String),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(orientation: ShadcnViewComponents::Contracts::Attachment::DEFAULTS.fetch(:orientation),
                   size: ShadcnViewComponents::Contracts::Attachment::DEFAULTS.fetch(:size), **args)
      @orientation = T.let(normalize_option(:orientation, orientation), Symbol)
      @size = T.let(normalize_option(:size, size), Symbol)
      super(**args)
    end

    sig { override.returns(T::Hash[Symbol, VariantOption]) }
    def variant_options
      { orientation: @orientation, size: @size }
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(orientation: @orientation, size: @size)
    end

    class Group < BaseComponent
      # div
    end

    class Media < BaseComponent
      # サムネイル領域(variant: image/file)
      sig { params(variant: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(variant: ShadcnViewComponents::Contracts::Attachment::Media::DEFAULTS.fetch(:variant), **args)
        @variant = T.let(normalize_option(:variant, variant), Symbol)
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { variant: @variant }
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def contract_data_attributes
        super.merge(variant: @variant)
      end
    end

    class Content < BaseComponent
      # div
    end

    class Title < BaseComponent
      # div
    end

    class Description < BaseComponent
      # div
    end

    class Actions < BaseComponent
      # div
    end

    class Action < BaseComponent
      class << self
        extend T::Sig

        sig do
          params(extra: T.nilable(String), options: T::Hash[Symbol, T.nilable(T.any(Symbol, String))]).returns(String).checked(:never)
        end
        def classes(extra: nil, **options)
          unknown = options.keys - %i[variant size]
          raise ArgumentError, "unknown variant props: #{unknown.inspect}" unless unknown.empty?

          variant = options[:variant] || :ghost
          size = options[:size] || :"icon-xs"
          T.unsafe(ShadcnViewComponents::Classes).resolve(:button, extra: extra, variant: variant, size: size)
        end
      end

      sig do
        params(variant: T.any(Symbol, String), size: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never)
      end
      def initialize(variant: :ghost, size: :"icon-xs", **args)
        @variant = T.let(ShadcnViewComponents::Classes.normalize_option(:button, :variant, variant), Symbol)
        @size = T.let(ShadcnViewComponents::Classes.normalize_option(:button, :size, size), Symbol)
        super(**args)
      end

      sig { override.returns(String) }
      def call
        attributes = @html_args.merge(class: @user_class)
        attributes[:type] = "button" unless attributes.key?(:type)
        merge_nested(attributes, :data, { slot: "attachment-action" })
        render(::Shadcn::Button.new(variant: @variant, size: @size, **attributes)) { content }
      end
    end

    class Trigger < BaseComponent
      # button(削除等の個別操作)
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.tap { |attributes| attributes[:type] = "button" unless attributes.key?(:type) }
      end
    end
  end
end
