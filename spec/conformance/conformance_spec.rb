# frozen_string_literal: true

# 適合試験(07-testing §3)— 生成契約 vs レンダリングHTML。
# スペックは手書きしない: spec/conformance/registry.yml を走査して動的にexampleを生成する。
# upstreamでバリアントが増えれば生成物のCOMBINATIONSが増え、このスペックも自動的に増える。
require "rails_helper"
require "yaml"

registry = YAML.safe_load_file(File.expand_path("registry.yml", __dir__))
allowances = YAML.safe_load_file(File.expand_path("allowances.yml", __dir__)) || {}

registry.reject { |_name, entry| entry["pending"] }.each do |name, entry|
  component_class = entry.fetch("component").constantize
  contract = ShadcnViewComponents::Contracts.const_get(name.camelize)
  root_slot = contract::SLOTS.find { |slot| slot[:name] == contract::ROOT_SLOT } || contract::SLOTS.first || {}
  allowed_extra = allowances.dig(name, "attributes") || []

  RSpec.describe "conformance: #{name}", type: :conformance do
    contract::COMBINATIONS.each do |options, expected_classes|
      it "renders classes matching upstream for #{options.inspect}" do
        render_inline(component_class.new(**options))

        expect(rendered_root_element).to conform_with_contract(
          classes: expected_classes,
          data_slot: contract::ROOT_SLOT,
          static_attributes: root_slot[:static_attributes] || {},
          dynamic_attributes: root_slot[:dynamic_attributes] || [],
          allowed_extra: allowed_extra
        )
      end
    end

    it "renders exactly the contract's data-slot set" do
      render_inline(component_class.new)

      rendered_slots = Nokogiri::HTML5(rendered_content).css("[data-slot]").map { |node| node["data-slot"] }.uniq.sort
      contract_slots = contract::SLOTS.map { |slot| slot[:name] }.sort

      expect(rendered_slots).to eq(contract_slots)
    end
  end
end
