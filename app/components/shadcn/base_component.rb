# typed: strict
# frozen_string_literal: true

module Shadcn
  # 共通基底(04-component-conventions §5-6)。属性マージ・クラス解決・tag差し替えを担う。
  # 利用者が直接参照しない private 扱いのクラス。
  class BaseComponent < ViewComponent::Base
    extend T::Sig

    VariantOption = T.type_alias { T.nilable(T.any(Symbol, String)) }

    # HTMLのvoid要素。閉じタグを付けてはならない
    VOID_ELEMENTS = %w[area base br col embed hr img input link meta source track wbr].freeze

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

    # 構造を持たない単一要素コンポーネントの既定レンダリング。
    # ERBテンプレートを置かない限りこれが使われる(クラス文字列を持たない — 04 §5)。
    # 構造を持つコンポーネント(Buttonのdata属性、Tableのラッパー等)はcallを上書きするか
    # sidecarテンプレートを置く
    sig { returns(String) }
    def call
      return open_tag if void_element?

      content_tag(tag, **html_attributes) { content }
    end

    sig { returns(T::Boolean) }
    def void_element?
      VOID_ELEMENTS.include?(tag)
    end

    private

    # void要素は閉じタグ無しで出力する。
    # NOTE: content_tag はブロック付き呼び出しでのみ第二引数ハッシュが属性扱いになるため
    # 空ブロックを渡してから閉じタグを取り除く
    sig { returns(String) }
    def open_tag
      void_tag(tag, **html_attributes)
    end

    # 指定タグの void 要素(input/br/hr 等)を閉じタグ無しで出力する統一ヘルパ。
    # 手書きの input 描画で使う(閉じタグ付き <input></input> はHTML仕様違反のため)
    # attrs を T.untyped にするのは srb の rest-kwargs モデル対策(呼び出し側の
    # 任意キーワードを attrs に誤バインドする既知の挙動のため)
    sig { params(name: String, attrs: T.untyped).returns(String) }
    def void_tag(name, **attrs)
      content_tag(name, **attrs) { "".html_safe }
        .then { |markup| markup.sub(%r{></#{Regexp.escape(name)}>\z}, ">") }
        .then(&:html_safe)
    end

    # asChild代替(04 §3.3): 同じクラス・スロット構造で要素名だけ変える。
    # 契約タグがPrimitives由来(AvatarPrimitive.Root 等)でHTML要素名ではない場合は
    # この既定タグへフォールバックする(各コンポーネントが上書きしてよい)
    sig { returns(String) }
    def tag
      return @tag if @tag

      contract_tag = T.cast(contract_root_slot[:tag], T.nilable(String))
      return contract_tag if contract_tag&.match?(/\A[a-z][a-z0-9-]*\z/)

      default_tag
    end

    # 契約タグがHTML要素名ではないときの描画タグ
    sig { returns(String) }
    def default_tag
      "div"
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

    # 契約由来の data 属性。ルートの data-slot は必ず出力する(04 §4.2)。
    # ルートがラッパー等で data-slot を持たない契約では、契約クラスが属する要素の
    # スロット(CLASSES_SLOT)に出す。どちらも無い契約(spinner等)では出さない
    sig { returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      root_slot = T.cast(contract_root_slot[:name], T.nilable(String)).to_s
      root_slot = T.cast(contract.const_get(:CLASSES_SLOT), T.nilable(String)).to_s if root_slot.empty? && contract.const_defined?(:CLASSES_SLOT)
      root_slot.empty? ? {} : { slot: root_slot }
    end

    sig { returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = static_attribute_defaults.merge(@html_args)
      attributes[:class] = resolved_class
      merge_nested(attributes, :data, contract_data_attributes)
      merge_nested(attributes, :aria, {})
      attributes
    end

    sig { returns(T::Module[T.anything]) }
    def contract
      self.class.contract
    end

    sig { returns(T::Hash[Symbol, T.untyped]) }
    def contract_root_slot
      root_slot_name = T.cast(contract.const_get(:ROOT_SLOT), String)
      contract_slot(root_slot_name)
    end

    # 契約のスロット定義を data-slot 名で引く
    sig { params(slot_name: String).returns(T::Hash[Symbol, T.untyped]) }
    def contract_slot(slot_name)
      slots = T.cast(contract.const_get(:SLOTS), T::Array[T::Hash[Symbol, T.untyped]])
      slots.find { |slot| slot[:name] == slot_name } || {}
    end

    # 契約の static_attributes を既定値として採用(利用者指定が優先 — 04 §6)。
    # cn を経ない静的 className(table のラッパー等)は class キーとして現れるため
    # resolved_class で統合する
    sig { returns(T::Hash[Symbol, T.untyped]) }
    def static_attribute_defaults
      T.cast(contract_root_slot[:static_attributes], T::Hash[Symbol, T.untyped])
       .transform_keys(&:to_sym)
    end

    sig { returns(String) }
    def resolved_class
      static_class = T.cast(static_attribute_defaults[:class], T.nilable(String))
      extra = [static_class, @user_class].compact.join(" ")
      extra = nil if extra.empty?
      self.class.classes(extra: extra, **variant_options)
    end

    # style は利用者が文字列・ハッシュどちらで渡しても壊れないよう結合する。
    # 出力は常に文字列とする(ハッシュのまま渡すとレンダラの整形に依存するため)。
    # gem 側の宣言を先頭に付け、CSSの後勝ちに従い利用者が上書きできる
    sig { params(attributes: T::Hash[Symbol, T.untyped], defaults: T::Hash[Symbol, T.untyped]).void }
    def merge_style(attributes, defaults)
      user = attributes[:style]
      base = defaults.map { |key, value| "#{key}: #{value}" }.join("; ")
      user_part = if user.is_a?(Hash)
                    user.map { |key, value| "#{key}: #{value}" }.join("; ")
                  else
                    user.to_s
                  end
      attributes[:style] = [base, user_part].reject(&:empty?).join("; ")
    end

    # data: / aria: は深部マージ(契約由来の値と利用者指定が共存する)
    sig { params(attributes: T::Hash[Symbol, T.untyped], key: Symbol, defaults: T::Hash[Symbol, T.untyped]).void }
    def merge_nested(attributes, key, defaults)
      user = T.cast(attributes[key], T.nilable(T::Hash[Symbol, T.untyped]))
      attributes[key] = defaults.merge(user || {})
    end
  end
end
