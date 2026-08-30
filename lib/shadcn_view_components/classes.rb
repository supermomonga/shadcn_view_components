# typed: strict
# frozen_string_literal: true

require "tailwind_merge"

module ShadcnViewComponents
  # 契約(lib/shadcn_view_components/generated/contracts)を引いて、
  # 事前解決済みの最終クラス文字列を返すランタイムヘルパ。
  #
  # Ruby側にマージロジックの再実装を持たないことが upstream との視覚的一致の要点であり、
  # ここで行うのは (1) 組み合わせテーブルの辞書引き (2) 呼び出し元の追加クラスとの統合のみ。
  module Classes
    extend T::Sig

    # NOTE: module_function はディレクティブ形式で使う(修飾子形式 + rest.kwargsは
    # sorbet-runtimeの実行時検証がrest引数を誤バインドするため)

    module_function

    VariantValue = T.type_alias { T.nilable(T.any(Symbol, String)) }

    MERGER = TailwindMerge::Merger.new

    sig { params(component: Symbol).returns(T::Module[T.anything]) }
    def contract_for(component)
      constant_path = component.to_s.split("/").map do |segment|
        ShadcnViewComponents::ComponentNaming.constant_name(segment)
      end.join("::")
      ShadcnViewComponents::Contracts.const_get(constant_path, false)
    end

    sig do
      params(
        component: Symbol,
        extra: T.nilable(String),
        options: T::Hash[Symbol, VariantValue]
      ).returns(String)
    end
    def resolve(component, extra: nil, **options)
      contract = contract_for(component)
      defaults = T.cast(contract.const_get(:DEFAULTS), T::Hash[Symbol, Symbol])
      normalized = {}
      options.each do |prop, value|
        normalized[prop] = normalize_option(component, prop, T.cast(value, T.any(Symbol, String))) unless value.nil?
      end
      resolved = T.cast(T.unsafe(contract).combination(defaults.merge(normalized)), String)
      # 追加クラスが無いときは事前解決済み文字列をそのまま返す(契約との完全一致を保証)。
      # あるときのみ tailwind_merge で統合する(利用者の上書きが後勝ち)。
      return resolved if extra.nil? || extra.empty?

      MERGER.merge("#{resolved} #{extra}")
    end

    # バリアント値の正規化 + fail-fast検証(01-architecture §6.1)。
    # 契約に存在しない値は静かにデフォルトへ落とさず ArgumentError。
    sig { params(component: Symbol, prop: Symbol, value: T.any(Symbol, String)).returns(Symbol) }
    def normalize_option(component, prop, value)
      contract = contract_for(component)
      allowed = T.cast(contract.const_get(:VARIANTS), T::Hash[Symbol, T::Array[Symbol]])
      values = allowed.fetch(prop) do
        Kernel.raise ArgumentError, "unknown variant prop #{prop.inspect} for #{contract} (valid: #{allowed.keys.map(&:inspect).join(', ')})"
      end
      symbol = value.to_sym
      Kernel.raise ArgumentError, "unknown variant value #{value.inspect} for #{prop} of #{contract} (valid: #{values.map(&:inspect).join(', ')})" unless values.include?(symbol)
      symbol
    end
  end
end
