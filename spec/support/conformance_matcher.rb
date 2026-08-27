# frozen_string_literal: true

# 「クラス列が契約に一致する」カスタムマッチャ(07-testing §2)。
#
# 検証内容(07-testing §3.3):
# - クラス列: ルート要素のclassが契約の事前解決文字列と順序含め完全一致(正規化: 連続空白の圧縮のみ)
# - data-slot: ルート要素の data-slot が契約の root_slot と一致
# - 静的属性: 契約 static_attributes が出力に含まれる
# - 過剰属性: 契約 ∪ dynamic ∪ 許可リスト(allowances.yml)以外の属性が出ていない
RSpec::Matchers.define :conform_with_contract do |contract_data|
  chain(:with_allowances) { |attributes| contract_data[:allowed_extra] = attributes }

  match do |element|
    @failures = []

    actual_classes = element["class"].to_s.split(/\s+/)
    expected_classes = contract_data[:classes].split(/\s+/)
    unless actual_classes == expected_classes
      @failures << <<~MESSAGE
        classes do not match the pre-resolved contract string:
          expected: #{expected_classes.join(' ')}
          actual:   #{actual_classes.join(' ')}
          missing:  #{(expected_classes - actual_classes).join(' ')}
          extra:    #{(actual_classes - expected_classes).join(' ')}
      MESSAGE
    end

    @failures << "data-slot: expected #{contract_data[:data_slot].inspect}, got #{element['data-slot'].inspect}" unless element["data-slot"] == contract_data[:data_slot]

    contract_data.fetch(:static_attributes, {}).each do |name, value|
      @failures << "static attribute #{name}: expected #{value.inspect}, got #{element[name.to_s].inspect}" unless element[name.to_s] == value
    end

    allowed = (%w[class data-slot] +
               contract_data.fetch(:static_attributes, {}).keys.map(&:to_s) +
               contract_data.fetch(:dynamic_attributes, []) +
               contract_data.fetch(:allowed_extra, [])).uniq
    extra_attributes = element.attributes.keys - allowed
    @failures << "unexpected attributes beyond contract ∪ allowances: #{extra_attributes.join(', ')}" unless extra_attributes.empty?

    @failures.empty?
  end

  failure_message do |_element|
    "component does not conform to its contract:\n#{@failures.map { |failure| "  - #{failure}" }.join("\n")}"
  end
end
