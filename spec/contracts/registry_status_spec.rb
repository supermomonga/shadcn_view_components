# frozen_string_literal: true

require "rails_helper"
require "yaml"

# registry.ymlの状態モデル(exports / unsupported)を検証する純粋関数群。
# RSpec.describeブロック外のObjectへ定義しないためのモジュール
module RegistryStatusValidation
  UNSUPPORTED_KEYS = %w[alternatives reason reviewed_sha256].freeze

  module_function

  def entry_status_errors(item, entry)
    status_keys = entry.keys & %w[exports unsupported]
    return [] if entry.keys.length == 1 && status_keys.length == 1

    ["#{item}: entry must contain exactly one of exports or unsupported"]
  end

  def exports_entry_errors(item, entry)
    exports = entry["exports"]
    return [] if exports.is_a?(Array) && exports.any?

    ["#{item}: exports must be a non-empty array"]
  end

  def alternatives_errors(item, alternatives, implemented_items)
    return ["#{item}: alternatives must be a non-empty array"] unless alternatives.is_a?(Array) && alternatives.any?

    errors = []
    errors << "#{item}: alternatives must contain unique strings" unless alternatives.all?(String) && alternatives.uniq == alternatives
    unknown = alternatives.reject { |alternative| implemented_items.include?(alternative) }
    errors << "#{item}: alternatives must reference implemented items: #{unknown.join(', ')}" if unknown.any?
    errors
  end

  def sha_errors(item, reviewed_sha256, manifest_items)
    errors = []
    format_ok = reviewed_sha256.is_a?(String) && reviewed_sha256.match?(/\A[0-9a-f]{64}\z/)
    errors << "#{item}: reviewed_sha256 must be 64 lowercase hexadecimal characters" unless format_ok
    errors << "#{item}: reviewed_sha256 must match the vendored manifest" unless reviewed_sha256 == manifest_items.dig(item, "sha256")
    errors
  end

  def unsupported_errors(item, unsupported, implemented_items, manifest_items)
    return ["#{item}: unsupported must be a mapping"] unless unsupported.is_a?(Hash)

    errors = []
    keys_message = "#{item}: unsupported keys must be #{UNSUPPORTED_KEYS.join(', ')}"
    errors << keys_message unless unsupported.keys.sort == UNSUPPORTED_KEYS

    reason = unsupported["reason"]
    errors << "#{item}: reason must contain at least 20 characters" unless reason.is_a?(String) && reason.strip.length >= 20
    errors.concat(alternatives_errors(item, unsupported["alternatives"], implemented_items))
    errors.concat(sha_errors(item, unsupported["reviewed_sha256"], manifest_items))
    errors
  end

  def entry_errors(item, entry, implemented_items, manifest_items)
    return ["#{item}: entry must be a mapping"] unless entry.is_a?(Hash)

    status_errors = entry_status_errors(item, entry)
    return status_errors unless status_errors.empty?

    if entry.key?("exports")
      exports_entry_errors(item, entry)
    else
      unsupported_errors(item, entry["unsupported"], implemented_items, manifest_items)
    end
  end

  def validation_errors(registry, manifest_items)
    errors = []
    keys_ok = registry.keys.sort == manifest_items.keys.sort
    errors << "registry keys must exactly match manifest items" unless keys_ok

    implemented_items = registry.filter_map { |item, entry| item if entry.is_a?(Hash) && entry.key?("exports") }.to_set

    registry.each do |item, entry|
      errors.concat(entry_errors(item, entry, implemented_items, manifest_items))
    end

    errors
  end

  def deep_copy(value)
    Marshal.load(Marshal.dump(value))
  end
end

RSpec.describe "conformance registry status" do
  let(:registry) do
    YAML.safe_load_file(File.join(REPO_ROOT, "spec/conformance/registry.yml"), aliases: false)
  end
  let(:manifest_items) do
    JSON.parse(File.read(File.join(REPO_ROOT, "vendor/shadcn/manifest.json"))).fetch("items")
  end
  let(:validate) { RegistryStatusValidation }

  it "classifies every manifest item as implemented or intentionally unsupported" do
    errors = validate.validation_errors(registry, manifest_items)

    expect(errors).to be_empty, errors.join("\n")
    expect(registry.count { |_item, entry| entry.key?("exports") }).to eq(61)
    expect(registry.count { |_item, entry| entry.key?("unsupported") }).to eq(2)
  end

  it "rejects a pending entry" do
    changed = validate.deep_copy(registry)
    changed["toast"] = { "pending" => true }

    expect(validate.validation_errors(changed, manifest_items)).to include(
      "toast: entry must contain exactly one of exports or unsupported"
    )
  end

  it "rejects an entry with both exports and unsupported" do
    changed = validate.deep_copy(registry)
    changed["toast"]["exports"] = []

    expect(validate.validation_errors(changed, manifest_items)).to include(
      "toast: entry must contain exactly one of exports or unsupported"
    )
  end

  it "rejects a missing reason" do
    changed = validate.deep_copy(registry)
    changed.dig("toast", "unsupported").delete("reason")

    errors = validate.validation_errors(changed, manifest_items)
    expect(errors).to include("toast: unsupported keys must be alternatives, reason, reviewed_sha256")
    expect(errors).to include("toast: reason must contain at least 20 characters")
  end

  it "rejects an alternative that is not implemented" do
    changed = validate.deep_copy(registry)
    changed.dig("toast", "unsupported", "alternatives") << "questionnaire"

    expect(validate.validation_errors(changed, manifest_items)).to include(
      "toast: alternatives must reference implemented items: questionnaire"
    )
  end

  it "rejects a duplicate alternative" do
    changed = validate.deep_copy(registry)
    changed.dig("toast", "unsupported", "alternatives") << "sonner"

    expect(validate.validation_errors(changed, manifest_items)).to include(
      "toast: alternatives must contain unique strings"
    )
  end

  it "rejects an outdated reviewed SHA" do
    changed = validate.deep_copy(registry)
    changed.dig("toast", "unsupported")["reviewed_sha256"] = "0" * 64

    expect(validate.validation_errors(changed, manifest_items)).to include(
      "toast: reviewed_sha256 must match the vendored manifest"
    )
  end

  it "rejects a malformed reviewed SHA" do
    changed = validate.deep_copy(registry)
    changed.dig("toast", "unsupported")["reviewed_sha256"] = "not-a-sha"

    errors = validate.validation_errors(changed, manifest_items)
    expect(errors).to include("toast: reviewed_sha256 must be 64 lowercase hexadecimal characters")
    expect(errors).to include("toast: reviewed_sha256 must match the vendored manifest")
  end

  it "rejects unknown unsupported keys" do
    changed = validate.deep_copy(registry)
    changed.dig("toast", "unsupported")["deferred"] = true

    expect(validate.validation_errors(changed, manifest_items)).to include(
      "toast: unsupported keys must be alternatives, reason, reviewed_sha256"
    )
  end

  it "rejects registry keys that do not match the manifest" do
    changed = validate.deep_copy(registry)
    changed.delete("toast")

    expect(validate.validation_errors(changed, manifest_items)).to include(
      "registry keys must exactly match manifest items"
    )
  end
end
