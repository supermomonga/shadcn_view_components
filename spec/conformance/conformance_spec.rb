# frozen_string_literal: true

# 適合試験(07-testing §3)— 生成契約 vs レンダリングHTML。
# スペックは手書きしない: spec/conformance/registry.yml を走査して動的にexampleを生成する。
# upstreamでバリアントが増えれば生成物のCOMBINATIONSが増え、このスペックも自動的に増える。
require "rails_helper"
require "yaml"

registry = YAML.safe_load_file(File.expand_path("registry.yml", __dir__))
allowances = YAML.safe_load_file(File.expand_path("allowances.yml", __dir__)) || {}

# レジストリエントリを [component_class, export_name] のペアへ正規化する。
# 単純なアイテムは component/export、複合アイテムは exports: のリストで列挙する
def normalized_exports(entry)
  if entry["exports"]
    entry["exports"].map { |export| [export.fetch("component"), export.fetch("export")] }
  elsif entry["component"]
    [[entry.fetch("component"), entry["export"]]]
  else
    []
  end
end

registry.reject { |_name, entry| entry["pending"] }.each do |name, entry|
  item_allowances = allowances[name] || {}

  normalized_exports(entry).each do |component_name, export_name|
    component_class = component_name.constantize
    contract = ShadcnViewComponents::Contracts.const_get(component_name.delete_prefix("Shadcn::"))
    root_slot = contract::ROOT_SLOT
    slot_definition = contract::SLOTS.find { |slot| slot[:name] == root_slot } || contract::SLOTS.first || {}
    # 契約クラスがルート以外の要素に属する構造(Tableのラッパー等)はその要素を検証対象にする
    classes_slot = contract.const_defined?(:CLASSES_SLOT) ? contract.const_get(:CLASSES_SLOT) : root_slot

    export_allowances = item_allowances[export_name] || {}
    allowed_extra = export_allowances["attributes"] || []
    class_contains = export_allowances["class_mode"] == "contains"

    RSpec.describe "conformance: #{name}/#{export_name}", type: :conformance do
      contract::COMBINATIONS.each do |options, expected_classes|
        it "renders classes matching upstream for #{options.inspect}" do
          render_inline(component_class.new(**options))

          target = if classes_slot.to_s.empty? || classes_slot == root_slot
                     rendered_root_element
                   else
                     rendered_fragment.css("[data-slot='#{classes_slot}']").first
                   end

          # ラッパー構造(Table等)では、検証対象要素自身の data-slot を確認する
          # (ルート要素の data-slot はスロット集合の検証の方でカバーされる)
          data_slot_for_target = classes_slot.to_s.empty? || classes_slot == root_slot ? root_slot : classes_slot

          expect(target).to conform_with_contract(
            classes: expected_classes,
            data_slot: data_slot_for_target,
            static_attributes: slot_definition[:static_attributes] || {},
            dynamic_attributes: slot_definition[:dynamic_attributes] || [],
            allowed_extra: allowed_extra,
            class_contains: class_contains
          )
        end
      end

      it "renders exactly the contract's data-slot set" do
        render_inline(component_class.new)

        rendered_slots = rendered_fragment.css("[data-slot]").map { |node| node["data-slot"] }.uniq.sort
        contract_slots = contract::SLOTS.map { |slot| slot[:name] }.reject(&:empty?).sort

        expect(rendered_slots).to eq(contract_slots)
      end
    end
  end
end
