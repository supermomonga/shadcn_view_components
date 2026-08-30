# frozen_string_literal: true

require "rails_helper"
require_relative "../support/component_coverage"

RSpec.describe "component coverage registry" do
  subject(:coverage) { ComponentCoverage.registry }

  let(:component_registry) { YAML.safe_load_file(File.expand_path("../conformance/registry.yml", __dir__)) }
  let(:implemented_items) { component_registry.reject { |_item, entry| entry["pending"] }.keys.sort }
  let(:registered_controllers) do
    File.read(File.join(REPO_ROOT, "app/assets/javascripts/shadcn/index.js"))
        .scan(/application\.register\("([^"]+)"/).flatten.sort
  end

  it "covers every implemented item exactly once" do
    expect(coverage.keys.sort).to eq(implemented_items)
  end

  it "has a closed schema with explicit coverage decisions" do
    coverage.each do |item, entry|
      expect(entry.keys.sort).to eq(%w[interaction parity preview render_smoke system]), item
      expect(entry.fetch("render_smoke")).to eq("all_exports"), item

      preview = entry.fetch("preview")
      if preview.key?("excluded")
        expect(preview.keys).to eq(["excluded"]), item
        expect(preview.fetch("excluded").keys).to eq(["reason"]), item
        expect(preview.dig("excluded", "reason").to_s.strip.length).to be >= 20
      else
        expect(preview.keys).to eq(["path"]), item
        expect(preview.fetch("path")).to match(%r{\Ashadcn/[a-z0-9_]+/[a-z0-9_]+\z}), item
      end

      interaction = entry.fetch("interaction")
      expect(interaction.keys.sort).to eq(%w[controllers kind]), item
      expect(ComponentCoverage::KINDS).to include(interaction.fetch("kind")), item
      expect(interaction.fetch("controllers")).to be_an(Array), item
      expect(interaction.fetch("controllers")).to eq(interaction.fetch("controllers").uniq), item

      system_covered = entry.fetch("system").key?("specs")
      case interaction.fetch("kind")
      when "static"
        expect(interaction.fetch("controllers")).to be_empty, item
        expect(system_covered).to be(false), item
      when "native"
        expect(interaction.fetch("controllers")).to be_empty, item
        expect(system_covered).to be(true), item
      when "controller", "event"
        expect(interaction.fetch("controllers")).not_to be_empty, item
        expect(system_covered).to be(true), item
      end

      validate_union(item, entry.fetch("parity"), covered: "scenarios")
      validate_union(item, entry.fetch("system"), covered: "specs", additional: "behaviors")
    end
  end

  it "references real previews" do
    available = ViewComponent::Preview.all.flat_map do |preview|
      preview.examples.map { |example| "#{preview.preview_name}/#{example}" }
    end
    declared = coverage.values.filter_map { |entry| entry.dig("preview", "path") }

    expect(declared - available).to be_empty
  end

  it "has unique parity pairs and valid thresholds" do
    scenarios = ComponentCoverage.parity_scenarios
    pairs = scenarios.map { |scenario| [scenario.fetch("preview"), scenario.fetch("demo")] }
    expect(pairs.uniq).to eq(pairs)

    scenarios.each do |scenario|
      expect(scenario.keys - %w[item preview demo threshold dark_threshold min_height]).to be_empty
      %w[threshold dark_threshold].each do |key|
        next unless scenario.key?(key)

        expect(scenario.fetch(key)).to be_between(0, 1).exclusive, "#{scenario.fetch('item')}/#{key}"
      end
    end
  end

  it "declares every distributed controller and no unknown controller" do
    declared = coverage.values.flat_map { |entry| entry.dig("interaction", "controllers") }.uniq.sort
    expect(declared).to eq(registered_controllers)
  end

  it "references existing system specs" do
    paths = coverage.values.flat_map { |entry| entry.dig("system", "specs") || [] }.uniq
    missing = paths.reject { |path| File.file?(File.join(REPO_ROOT, path)) }
    expect(missing).to be_empty
  end

  # rubocop:disable-next Metrics/AbcSize
  define_method(:validate_union) do |item, value, covered:, additional: nil|
    covered_keys = [covered, additional].compact
    is_covered = covered_keys.all? { |key| value.key?(key) }
    is_excluded = value.keys == ["excluded"]
    expect([is_covered, is_excluded].count(true)).to eq(1), item

    if is_excluded
      expect(value.fetch("excluded").keys).to eq(["reason"]), item
      expect(value.dig("excluded", "reason").to_s.strip.length).to be >= 20
    else
      expect(value.keys.sort).to eq(covered_keys.sort), item
      covered_keys.each { |key| expect(value.fetch(key)).to be_a(Array).and be_present }
    end
  end
end
