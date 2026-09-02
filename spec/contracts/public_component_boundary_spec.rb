# frozen_string_literal: true

require "rails_helper"
require "yaml"

module PublicComponentBoundary
  Entry = Data.define(:component_name, :args, :content)

  module_function

  def entries
    registry = YAML.safe_load_file(File.expand_path("../conformance/registry.yml", __dir__))
    registry.select { |_name, item| item.key?("exports") }.values.flat_map do |item|
      item.fetch("exports").filter_map do |export|
        next unless export["component"]

        Entry.new(
          component_name: export.fetch("component"),
          args: export.fetch("args", {}).transform_keys(&:to_sym),
          content: export["content"]
        )
      end
    end
  end

  def public_component_names
    Rails.application.eager_load!
    base_component = Shadcn.const_get(:BaseComponent, false)
    public_constants(Shadcn, Set.new)
      .select { |constant| constant.is_a?(Class) && constant < base_component }
      .map(&:name)
      .compact
      .sort
  end

  def public_constants(namespace, visited)
    return [] if visited.include?(namespace.object_id)

    visited << namespace.object_id
    namespace.constants(false).flat_map do |name|
      constant = namespace.const_get(name, false)
      next [] unless constant.is_a?(Module) && constant.name&.start_with?("Shadcn::")

      [constant, *public_constants(constant, visited)]
    end
  end
end

public_component_entries = PublicComponentBoundary.entries

RSpec.describe "public component boundary" do
  it "keeps every public component in the conformance registry and exposes no helpers as components" do
    registered_names = public_component_entries.map(&:component_name).uniq.sort

    expect(PublicComponentBoundary.public_component_names).to eq(registered_names)
  end
end

public_component_entries.each do |entry|
  RSpec.describe "public component: #{entry.component_name}", type: :component do
    it "has a valid root contract and renders its minimum configuration as a string" do
      component_class = entry.component_name.constantize
      contract = component_class.contract

      expect(contract.const_defined?(:ROOT_SLOT, false)).to be(true)
      expect(contract.const_defined?(:SLOTS, false)).to be(true)
      root_slot = contract.const_get(:ROOT_SLOT, false)
      slots = contract.const_get(:SLOTS, false)
      expect(root_slot).to be_a(String)
      expect(slots).to include(a_hash_including(name: root_slot))

      component = component_class.new(**entry.args)
      component = component.with_content(entry.content) unless entry.content.nil?
      rendered = ApplicationController.render(component, layout: false)
      expect(rendered).to be_a(String).and be_present

      document = Nokogiri::HTML5.fragment(rendered)
      if root_slot.empty?
        expect(document.element_children.first).not_to be_nil
      else
        expect(rendered).to match(/\bdata-slot=(["'])#{Regexp.escape(root_slot)}\1/)
      end
    end
  end
end
