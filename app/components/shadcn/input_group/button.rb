# typed: strict
# frozen_string_literal: true

module Shadcn
  class InputGroup < BaseComponent
    # upstream は Button を asChild で重ねる。本gemでは Button 描画結果に
    # data-slot を差し替える(Phase 3 の AlertDialogAction と同じ構成)。
    # NOTE: Shadcn::Button の sidecar テンプレートと名前が衝突するため専用ファイルに置く
    class Button < BaseComponent
      class << self
        extend T::Sig

        sig do
          params(extra: T.nilable(String), options: T::Hash[Symbol, T.nilable(T.any(Symbol, String))]).returns(String).checked(:never)
        end
        def classes(extra: nil, **options)
          unknown = options.keys - %i[variant size]
          raise ArgumentError, "unknown variant props: #{unknown.inspect}" unless unknown.empty?

          variant = options[:variant] || :ghost
          size = options[:size] || :xs
          button_variant = ShadcnViewComponents::Classes.normalize_option(:button, :variant, variant)
          group_size = ShadcnViewComponents::Classes.normalize_option(:"input_group/button", :size, size)
          overlay = T.unsafe(ShadcnViewComponents::Classes).resolve(:"input_group/button", extra: extra, size: group_size)
          T.unsafe(ShadcnViewComponents::Classes).resolve(:button, extra: overlay, variant: button_variant)
        end
      end

      sig do
        params(
          variant: T.any(Symbol, String),
          size: T.any(Symbol, String),
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(variant: :ghost, size: "xs", **args)
        @variant = T.let(
          ShadcnViewComponents::Classes.normalize_option(:button, :variant, variant),
          Symbol
        )
        @size = T.let(normalize_option(:size, size), Symbol)
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { size: @size }
      end

      # upstream の <Button> が基本クラスと variant を付け、
      # input-group 側の contract がサイズ調整を上書きする。
      sig { override.returns(String) }
      def call
        # Button に渡すのは InputGroup 固有のクラス。公開 classes は合成済みを返す。
        overlay = T.unsafe(ShadcnViewComponents::Classes).resolve(:"input_group/button", extra: @user_class, size: @size)
        attributes = @html_args.merge(class: overlay)
        attributes[:type] = "button" unless attributes.key?(:type)
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { size: @size }.merge(data)
        render(::Shadcn::Button.new(variant: @variant, **attributes)) { content }
      end
    end
  end
end
