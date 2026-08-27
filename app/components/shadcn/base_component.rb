# typed: strict
# frozen_string_literal: true

module Shadcn
  # 共通基底(04-component-conventions §5-6)。属性マージ・クラス解決・tag差し替えを担う。
  # 利用者が直接参照しない private 扱いのクラス。
  class BaseComponent < ViewComponent::Base
    extend T::Sig

    VariantOption = T.type_alias { T.nilable(T.any(Symbol, String)) }

    # ViewComponent::Base は initialize を持たず、ActionView::Base の initialize は
    # 互換性のない引数を取るため super を呼ばない(ViewComponentの標準的な慣行)。
    # この件は .rubocop.yml の Lint/MissingSuper Exclude にも反映している。
    # なお rest-kwargs を持つメソッドの実行時sig検証は sorbet-runtime の既知の誤バインドがあるため
    # checked(:never) で無効化し、srb tc の静的検査に委ねる(module_function 経由の
    # ShadcnViewComponents::Classes は実行時検証が正しく働くので検証はそこで行う)
    sig { params(args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(**args)
      raw_tag = args.delete(:tag)
      raw_class = args.delete(:class)
      @tag = T.let(raw_tag&.to_s, T.nilable(String))
      @user_class = T.let(raw_class&.to_s, T.nilable(String))
      @html_args = T.let(args, T::Hash[Symbol, T.untyped])
    end

    class << self
      extend T::Sig

      # 契約モジュールへのパス(例: Shadcn::Button → "button"、Shadcn::Card::Header → "card/header")
      sig { returns(String) }
      def contract_path
        to_s.delete_prefix("Shadcn::").underscore
      end

      sig { returns(T::Module[T.anything]) }
      def contract
        ShadcnViewComponents::Classes.contract_for(contract_path.to_sym)
      end

      # クラス文字列だけを提供するモジュール関数(04 §8)。
      # ホストが自前ERBに段階的に導入するための抜け道。
      # checked(:never) の理由は initialize のコメント参照(rest-kwargsの実行時検証問題)
      sig { params(extra: T.nilable(String), options: T::Hash[Symbol, VariantOption]).returns(String).checked(:never) }
      def classes(extra: nil, **options)
        ShadcnViewComponents::Classes.resolve(contract_path.to_sym, extra: extra, **options)
      end
    end

    # asChild代替(04 §3.3): 同じクラス・スロット構造で要素名だけ変える
    sig { returns(String) }
    def tag
      default = T.cast(contract_root_slot[:tag], T.nilable(String))
      (@tag || default || "div").to_s
    end

    # バリアント値の正規化 + fail-fast検証。契約に存在しない値は ArgumentError
    sig { params(prop: Symbol, value: T.any(Symbol, String)).returns(Symbol) }
    def normalize_option(prop, value)
      ShadcnViewComponents::Classes.normalize_option(self.class.contract_path.to_sym, prop, value)
    end

    # コンポーネント固有のバリアント組み合わせ(サブクラスが上書きする)
    sig { returns(T::Hash[Symbol, VariantOption]) }
    def variant_options
      {}
    end

    # 契約由来の data 属性。ルートの data-slot は必ず出力する(04 §4.2)
    sig { returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      { slot: contract_root_slot[:name] }
    end

    sig { returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = static_attribute_defaults.merge(@html_args)
      attributes[:class] = resolved_class
      merge_nested(attributes, :data, contract_data_attributes)
      merge_nested(attributes, :aria, {})
      attributes
    end

    private

    sig { returns(T::Module[T.anything]) }
    def contract
      self.class.contract
    end

    sig { returns(T::Hash[Symbol, T.untyped]) }
    def contract_root_slot
      slots = T.cast(contract.const_get(:SLOTS), T::Array[T::Hash[Symbol, T.untyped]])
      root_slot_name = T.cast(contract.const_get(:ROOT_SLOT), String)
      slots.find { |slot| slot[:name] == root_slot_name } || slots.first || {}
    end

    # 契約の static_attributes を既定値として採用(利用者指定が優先 — 04 §6)
    sig { returns(T::Hash[Symbol, T.untyped]) }
    def static_attribute_defaults
      T.cast(contract_root_slot[:static_attributes], T::Hash[Symbol, T.untyped])
       .transform_keys(&:to_sym)
    end

    sig { returns(String) }
    def resolved_class
      self.class.classes(extra: @user_class, **variant_options)
    end

    # data: / aria: は深部マージ(契約由来の値と利用者指定が共存する)
    sig { params(attributes: T::Hash[Symbol, T.untyped], key: Symbol, defaults: T::Hash[Symbol, T.untyped]).void }
    def merge_nested(attributes, key, defaults)
      user = T.cast(attributes[key], T.nilable(T::Hash[Symbol, T.untyped]))
      attributes[key] = defaults.merge(user || {})
    end
  end
end
