# frozen_string_literal: true

require "rails_helper"
require_relative "../support/component_coverage"

RSpec.describe "system component coverage", type: :system do
  it "matches declared specs and behaviors in both directions" do
    expected_spec_paths = ComponentCoverage.registry.values.flat_map { |entry| entry.dig("system", "specs") || [] }.uniq
    loaded_spec_paths = RSpec.world.example_groups.filter_map do |group|
      file_path = group.metadata[:file_path]
      Pathname(File.expand_path(file_path, REPO_ROOT)).relative_path_from(Pathname(REPO_ROOT)).to_s if file_path
    end.uniq
    skip "strict coverage comparison runs with the complete system suite" unless (expected_spec_paths - loaded_spec_paths).empty?

    actual = Hash.new { |hash, item| hash[item] = { "specs" => [], "behaviors" => [] } }
    RSpec.world.example_groups.each do |group|
      metadata = group.metadata.fetch(:component_coverage, {})
      metadata.each do |item, behaviors|
        relative_path = Pathname(File.expand_path(group.metadata.fetch(:file_path), REPO_ROOT))
                        .relative_path_from(Pathname(REPO_ROOT)).to_s
        actual[item.to_s]["specs"] << relative_path
        actual[item.to_s]["behaviors"].concat(Array(behaviors).map(&:to_s))
      end
    end
    actual.each_value do |entry|
      entry.each_value do |values|
        values.uniq!
        values.sort!
      end
    end

    expected = ComponentCoverage.registry.to_h do |item, entry|
      system = entry.fetch("system")
      next [item, nil] if system.key?("excluded")

      [item, system.transform_values(&:sort)]
    end.compact

    expect(actual).to eq(expected)
  end
end
