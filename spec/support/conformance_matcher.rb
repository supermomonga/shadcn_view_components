# frozen_string_literal: true

# 「クラス列が契約に一致する」カスタムマッチャ(07-testing §2)。
#
# 検証内容(07-testing §3.3、§3.4):
# - クラス列: 対象要素のclassが契約の事前解決文字列と順序含め完全一致(正規化: 連続空白の圧縮のみ)。
#   allowances で class_mode: contains を宣言した要素のみ「契約クラスを全て含む」検証に緩和される
# - data-slot: 対象要素の data-slot が契約の root_slot と一致。
#   root_slot が空(アイコン系)の場合は data-slot を持たないことを検証する
# - 静的属性: 契約 static_attributes が出力に含まれる
# - 過剰属性: 契約 ∪ dynamic ∪ 許可リスト(allowances.yml)以外の属性が出ていない
RSpec::Matchers.define :conform_with_contract do |contract_data|
  match do |element|
    @failures = []

    actual_classes = element["class"].to_s.split(/\s+/)
    expected_classes = contract_data[:classes].split(/\s+/)
    if contract_data[:class_contains]
      missing = expected_classes - actual_classes
      unless missing.empty?
        @failures << <<~MESSAGE
          rendered classes do not include all contract classes (contains mode):
            missing: #{missing.join(' ')}
            actual:  #{actual_classes.join(' ')}
        MESSAGE
      end
    elsif actual_classes != expected_classes
      @failures << <<~MESSAGE
        classes do not match the pre-resolved contract string:
          expected: #{expected_classes.join(' ')}
          actual:   #{actual_classes.join(' ')}
          missing:  #{(expected_classes - actual_classes).join(' ')}
          extra:    #{(actual_classes - expected_classes).join(' ')}
      MESSAGE
    end

    expected_slot = contract_data[:data_slot]
    if expected_slot.to_s.empty?
      @failures << "data-slot: expected none (icon-style contract), got #{element['data-slot'].inspect}" unless element["data-slot"].nil?
    elsif element["data-slot"] != expected_slot
      @failures << "data-slot: expected #{expected_slot.inspect}, got #{element['data-slot'].inspect}"
    end

    contract_data.fetch(:static_attributes, {}).each do |name, value|
      next if name.to_s == "class" # class はクラス列検証の方で扱う(ラッパー静的クラス等)

      # props系の静的属性(orientation 等)は data-* / aria-* 名前空間に置いて描画される
      candidates = [name.to_s, "data-#{name}", "aria-#{name}"]
      actual = candidates.map { |candidate| element[candidate] }
      next if actual.include?(value)

      @failures << "static attribute #{name}: expected #{value.inspect}, got #{actual.compact.inspect}"
    end

    # 動的属性は data-* / aria-* 名前空間に置いて描画されるため、接頭辞付きも許可する
    dynamics = contract_data.fetch(:dynamic_attributes, []).flat_map { |name| [name, "data-#{name}", "aria-#{name}"] }
    statics = contract_data.fetch(:static_attributes, {}).keys.flat_map { |name| [name.to_s, "data-#{name}", "aria-#{name}"] }
    allowed = (%w[class data-slot] + statics + dynamics + contract_data.fetch(:allowed_extra, [])).uniq
    extra_attributes = element.attributes.keys - allowed
    @failures << "unexpected attributes beyond contract ∪ allowances: #{extra_attributes.join(', ')}" unless extra_attributes.empty?

    @failures.empty?
  end

  failure_message do |_element|
    "component does not conform to its contract:\n#{@failures.map { |failure| "  - #{failure}" }.join("\n")}"
  end
end
