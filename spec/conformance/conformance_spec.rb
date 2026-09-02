# frozen_string_literal: true

# 適合試験(07-testing §3)— 生成契約 vs レンダリングHTML。
# スペックは手書きしない: spec/conformance/registry.yml を走査して動的にexampleを生成する。
# upstreamでバリアントが増えれば生成物のCOMBINATIONSが増え、このスペックも自動的に増える。
require "rails_helper"
require "yaml"

registry = YAML.safe_load_file(File.expand_path("registry.yml", __dir__))
allowances = YAML.safe_load_file(File.expand_path("allowances.yml", __dir__)) || {}

# レジストリエントリを [component_class, export_name, content, args] の組へ正規化する。
# 単純なアイテムは component/export、複合アイテムは exports: のリストで列挙する。
# content は「本文が無ければ描かない」コンポーネント(Form::Error 等)への検証用入力
def normalized_exports(entry)
  if entry["exports"]
    entry["exports"].map do |export|
      [export.fetch("component"), export.fetch("export"), export["content"], export.fetch("args", {})]
    end
  elsif entry["component"]
    [[entry.fetch("component"), entry.fetch("export"), nil, entry.fetch("args", {})]]
  else
    []
  end
end

registry.select { |_name, entry| entry.key?("exports") }.each do |name, entry|
  item_allowances = allowances[name] || {}

  normalized_exports(entry).each do |component_name, export_name, export_content, export_args|
    component_class = component_name.constantize
    base_args = export_args.transform_keys(&:to_sym)
    contract = ShadcnViewComponents::Contracts.const_get(component_name.delete_prefix("Shadcn::"))
    root_slot = contract::ROOT_SLOT
    slot_definition = contract::SLOTS.find { |slot| slot[:name] == root_slot } || contract::SLOTS.first || {}
    classes_slot = contract.const_defined?(:CLASSES_SLOT) ? contract.const_get(:CLASSES_SLOT) : root_slot
    if root_slot.to_s.empty?
      # ルートがDOMを持たない構成(portalラッパー等)では、クラスを持つスロットの
      # 属性定義(static/dynamic)を検証基準にする
      classes_slot_definition = contract::SLOTS.find { |slot| slot[:name] == classes_slot }
      slot_definition = classes_slot_definition if classes_slot_definition
    end
    # 契約クラスがルート以外の要素に属する構造(Tableのラッパー等)はその要素を検証対象にする
    # (classes_slot は直上で算出済み)
    root_static_class = slot_definition.is_a?(Hash) ? slot_definition.dig(:static_attributes, :class).to_s : ""
    # ルートに静的クラス、内側の(スロット無し)要素にcnを持つ二重構造(accordion-content等)。
    # 検証はルートに対して「静的クラス + 契約クラス」の結合で行う(両方の存否を検出できる)
    split_structure = classes_slot.to_s.empty? &&
                      contract::COMBINATIONS.values.any? { |classes| !classes.to_s.empty? } &&
                      !root_static_class.empty?

    export_allowances = item_allowances[export_name] || {}
    allowed_extra = export_allowances["attributes"] || []
    class_contains = export_allowances["class_mode"] == "contains"
    slots_superset = export_allowances["slots_mode"] == "superset"

    RSpec.describe "conformance: #{name}/#{export_name}", type: :conformance do
      contract::COMBINATIONS.each do |options, expected_classes|
        it "renders classes matching upstream for #{options.inspect}" do
          args = base_args.merge(options)
          if export_content
            render_inline(component_class.new(**args)) { export_content }
          else
            render_inline(component_class.new(**args))
          end

          # クラスが cn でなく静的className として記録された契約(コンボ "" + ルート静的クラス)
          static_only = !split_structure && expected_classes.to_s.empty? && !root_static_class.empty?
          expected = if split_structure || static_only
                       root_static_class
                     else
                       expected_classes
                     end

          # classes_slot が示す要素を検証対象にする(単一要素ならルートと一致する)
          target = if classes_slot.to_s.empty?
                     rendered_root_element
                   else
                     rendered_fragment.css("[data-slot='#{classes_slot}']").first || rendered_root_element
                   end

          # ラッパー構造(Table等)では、検証対象要素自身の data-slot を確認する
          # (ルート要素の data-slot はスロット集合の検証の方でカバーされる)
          data_slot_for_target = classes_slot.to_s.empty? || classes_slot == root_slot ? root_slot : classes_slot

          expect(target).to conform_with_contract(
            classes: expected,
            data_slot: data_slot_for_target,
            static_attributes: slot_definition[:static_attributes] || {},
            dynamic_attributes: slot_definition[:dynamic_attributes] || [],
            allowed_extra: allowed_extra,
            class_contains: class_contains
          )

          # 分離構造: 契約クラス(cn)はルートの最初の子要素が持つ
          if split_structure && !expected_classes.to_s.empty?
            inner = target.element_children.first
            actual_inner_classes = inner&.attr("class").to_s.split(/\s+/)
            expected_inner_classes = expected_classes.to_s.split(/\s+/)
            if class_contains
              expect(actual_inner_classes).to include(*expected_inner_classes),
                                              "split-structure inner element should contain the contract classes"
            else
              expect(actual_inner_classes).to eq(expected_inner_classes),
                                              "split-structure inner element should carry the contract classes"
            end
          end
        end
      end

      it "renders exactly the contract's data-slot set" do
        if export_content
          render_inline(component_class.new(**base_args)) { export_content }
        else
          render_inline(component_class.new(**base_args))
        end

        rendered_slots = rendered_fragment.css("[data-slot]").map { |node| node["data-slot"] }.uniq.sort
        contract_slots = contract::SLOTS.map { |slot| slot[:name] }.reject(&:empty?).uniq.sort

        # superset 許可(合成コンポーネント): 契約スロットが全て現れればよい
        if slots_superset
          expect(rendered_slots & contract_slots).to eq(contract_slots)
        else
          expect(rendered_slots).to eq(contract_slots)
        end
      end
    end
  end
end
