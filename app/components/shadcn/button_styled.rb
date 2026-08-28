# typed: strict
# frozen_string_literal: true

module Shadcn
  # オーバーレイ系Triggerにボタン装飾を付与する共用モジュール。
  #
  # upstream では <DialogTrigger asChild><Button variant="outline">…</Button></DialogTrigger>
  # のように asChild + Button で装飾するが、本gemのTriggerは常設の <button> 要素のため、
  # variant:/size: キーワードでボタンの契約クラスを合成して同等の見た目を提供する。
  # 指定しない場合は装飾なし(upstream の <XTrigger> 単体と同じ)。
  module ButtonStyled
    extend T::Sig

    # rest-kwargs を持つメソッドの実行時sig検証は sorbet-runtime の既知の誤バインドが
    # あるため checked(:never) で無効化し、srb tc の静的検査に委譲する(BaseComponent と同じ運用)
    sig do
      params(
        variant: T.nilable(T.any(Symbol, String)),
        size: T.nilable(T.any(Symbol, String)),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(variant: nil, size: nil, **args)
      @button_variant = T.let(variant && ShadcnViewComponents::Classes.normalize_option(:button, :variant, variant), T.nilable(Symbol))
      @button_size = T.let(size && ShadcnViewComponents::Classes.normalize_option(:button, :size, size), T.nilable(Symbol))
      super(**args)
    end

    private

    # 契約のボタンクラスを属性に合成する。variant:/size: 未指定の時は何もしない
    sig { params(attributes: T::Hash[Symbol, T.untyped]).returns(T::Hash[Symbol, T.untyped]) }
    def apply_button_styling(attributes)
      return attributes if @button_variant.nil? && @button_size.nil?

      options = { variant: @button_variant, size: @button_size }.compact
      attributes[:class] = ShadcnViewComponents::Classes.resolve(
        :button,
        extra: attributes[:class].to_s,
        **options
      )
      attributes
    end
  end
end
