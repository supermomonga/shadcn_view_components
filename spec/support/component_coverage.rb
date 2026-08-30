# frozen_string_literal: true

require "yaml"

module ComponentCoverage
  PATH = File.expand_path("../coverage/registry.yml", __dir__)
  KINDS = %w[static native controller event].freeze

  module_function

  def registry
    @registry ||= YAML.safe_load_file(PATH, aliases: false).freeze
  end

  def fetch(item)
    registry.fetch(item)
  end

  def parity_scenarios
    registry.flat_map do |item, entry|
      parity = entry.fetch("parity")
      next [] if parity.key?("excluded")

      parity.fetch("scenarios").map { |scenario| scenario.merge("item" => item) }
    end
  end
end
