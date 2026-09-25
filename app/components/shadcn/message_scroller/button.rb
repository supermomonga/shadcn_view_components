# typed: strict
# frozen_string_literal: true

module Shadcn
  class MessageScroller < BaseComponent
    # Button の sidecar テンプレートとの名前の衝突を避けるため専用ファイルに置く。
    class Button < BaseComponent
      class << self
        extend T::Sig

        sig do
          params(extra: T.nilable(String), options: T::Hash[Symbol, T.nilable(T.any(Symbol, String))]).returns(String).checked(:never)
        end
        def classes(extra: nil, **options)
          unknown = options.keys - %i[variant size]
          raise ArgumentError, "unknown variant props: #{unknown.inspect}" unless unknown.empty?

          variant = options[:variant] || :secondary
          size = options[:size] || :"icon-sm"
          overlay = ShadcnViewComponents::Classes.resolve(:"message_scroller/button", extra: extra)
          T.unsafe(ShadcnViewComponents::Classes).resolve(:button, extra: overlay, variant: variant, size: size)
        end
      end

      sig do
        params(
          variant: T.any(Symbol, String), size: T.any(Symbol, String),
          direction: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(variant: :secondary, size: :"icon-sm", direction: self.class.property_default(:direction), **args)
        @variant = T.let(ShadcnViewComponents::Classes.normalize_option(:button, :variant, variant), Symbol)
        @size = T.let(ShadcnViewComponents::Classes.normalize_option(:button, :size, size), Symbol)
        @direction = T.let(normalize_property(:direction, direction), String)
        super(**args)
      end

      sig { override.returns(String) }
      def call
        attributes = @html_args.merge(class: ShadcnViewComponents::Classes.resolve(:"message_scroller/button", extra: @user_class))
        attributes[:type] = "button" unless attributes.key?(:type)
        merge_nested(attributes, :data, { slot: "message-scroller-button", direction: @direction,
                                          variant: @variant, size: @size,
                                          action: "#{CONTROLLER}#scrollToBottom" })
        render(::Shadcn::Button.new(variant: @variant, size: @size, **attributes)) { content }
      end
    end
  end
end
