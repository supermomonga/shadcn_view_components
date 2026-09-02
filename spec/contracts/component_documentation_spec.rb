# frozen_string_literal: true

require "rails_helper"
require_relative "../../tools/documentation/component_reference"

RSpec.describe Documentation::ComponentReference do
  subject(:reference) { described_class.new(root: REPO_ROOT) }

  let(:component_registry) do
    YAML.safe_load_file(File.join(REPO_ROOT, "spec/conformance/registry.yml"), aliases: false)
  end
  let(:coverage_registry) do
    YAML.safe_load_file(File.join(REPO_ROOT, "spec/coverage/registry.yml"), aliases: false)
  end
  let(:implemented_registry) { component_registry.select { |_item, entry| entry.key?("exports") } }

  it "generates exactly one current API page for every implemented item" do
    expected_names = ["README.md", *implemented_registry.keys.map { |item| "#{item}.md" }].sort
    actual_names = Dir[File.join(REPO_ROOT, "docs/components/*.md")].map { |path| File.basename(path) }.sort

    expect(reference.validate_metadata!).to be(true)
    expect(reference.implemented_items).to eq(implemented_registry.keys.sort)
    expect(reference.metadata.keys.sort).to eq(implemented_registry.keys.sort)
    expect(reference.expected_files.keys.sort).to eq(expected_names)
    expect(actual_names).to eq(expected_names)

    reference.expected_files.each do |name, contents|
      expect(File.read(File.join(REPO_ROOT, "docs/components", name))).to eq(contents), name
    end
  end

  it "documents every public class and embeds the representative preview that CI renders" do
    implemented_registry.each do |item, registry_entry|
      page = reference.expected_files.fetch("#{item}.md")
      metadata = reference.metadata.fetch(item)
      preview_file = reference.preview_source(item)

      aggregate_failures(item) do
        registry_entry.fetch("exports").each do |export|
          component = export.fetch("component")
          expect(page).to match(/\| \[`#{Regexp.escape(component)}`\]\([^\n]+\) \| `new\(/)
        end

        metadata.dig("composition", "required").each { |component| expect(page).to include("`#{component}`") }
        expect(page).to include(metadata.dig("attributes", "default_target"))
        expect(page).to include(metadata.dig("form", "details"))
        expect(page).to include(metadata.dig("state", "details"))
        coverage_registry.dig(item, "interaction", "controllers").each do |controller|
          expect(page).to include("`#{controller}`")
        end
        expect(page).to include(File.read(preview_file).rstrip)
        expect(page).to include("spec/requests/lookbook_previews_spec.rb")
      end
    end
  end

  it "documents inherited mixin APIs, cross-component constraints, and required keywords accurately" do
    menubar = reference.expected_files.fetch("menubar.md")
    context_menu = reference.expected_files.fetch("context-menu.md")
    input_otp = reference.expected_files.fetch("input-otp.md")
    input_group = reference.expected_files.fetch("input-group.md")
    alert_dialog = reference.expected_files.fetch("alert-dialog.md")
    pagination = reference.expected_files.fetch("pagination.md")
    toggle_group = reference.expected_files.fetch("toggle-group.md")
    button_group = reference.expected_files.fetch("button-group.md")

    expect(menubar).to include(
      "`new(variant: nil, size: nil, **args)`<br>initializerはShadcn::ButtonStyledで定義",
      "`new(side: :bottom, align: :start, side_offset: 8, align_offset: -4, collision_padding: 5, **args)`"
    )
    expect(context_menu).to include(
      "`new(side: :right, align: :start, side_offset: 0, align_offset: 4, collision_padding: 5, **args)`"
    )
    expect(input_otp).to include("`new(index:, **args)` | index: number, integer, >= 0 |")
    expect(input_otp).not_to match(/index:[^\n]+default:/)
    expect(input_group).to match(%r{\[`Shadcn::InputGroup`\]\(../../app/components/shadcn/input_group\.rb#L\d+\)})
    expect(input_group).to include("variant: default, destructive, ghost, link, outline, secondary (default: :ghost)")
    expect(alert_dialog).to include("variant: default, destructive, ghost, link, outline, secondary (default: :outline)")
    expect(pagination).to include("size: default, icon, icon-lg, icon-sm, icon-xs, lg, sm, xs (default: :icon)")
    expect(toggle_group).to include("variant: default, outline (default: nil)", "size: default, lg, sm (default: nil)")
    expect(button_group).to include("orientation: horizontal, vertical (default: :vertical)")
  end

  it "detects initializer and preview changes until the reference is regenerated" do
    Dir.mktmpdir("component-documentation-") do |root|
      copy_reference_inputs(root)
      local_reference = described_class.new(root:)
      local_reference.generate

      expect { local_reference.check }.not_to raise_error

      button_path = File.join(root, "app/components/shadcn/button.rb")
      button_source = File.read(button_path)
      File.write(button_path, button_source.sub("def initialize(", "def initialize(documented: false, "))

      preview_path = local_reference.preview_source("accordion")
      File.write(preview_path, "#{File.read(preview_path).rstrip}\n# changed example\n")

      stale_reference = described_class.new(root:)
      expect { stale_reference.check }.to raise_error(RuntimeError) do |error|
        expect(error.message).to include(
          "docs/components/accordion.md is missing or stale",
          "docs/components/button.md is missing or stale"
        )
      end
    end
  end

  define_method(:copy_reference_inputs) do |root|
    %w[
      app/components/shadcn
      docs/component_reference
      gen/contracts
      spec/conformance
      spec/coverage
      spec/dummy/app/components/previews
    ].each do |relative_path|
      destination = File.join(root, relative_path)
      FileUtils.mkdir_p(File.dirname(destination))
      FileUtils.cp_r(File.join(REPO_ROOT, relative_path), destination)
    end
  end
end
