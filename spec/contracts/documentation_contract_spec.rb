# frozen_string_literal: true

require "rails_helper"
require "generators/shadcn_view_components/install_generator"
require_relative "../../tools/documentation/readme_inventory"

RSpec.describe "documentation contracts" do
  let(:readme) { File.read(File.join(REPO_ROOT, "README.md")) }
  let(:inventory) { Documentation::ReadmeInventory.new(root: REPO_ROOT) }
  let(:registry) { YAML.safe_load_file(File.join(REPO_ROOT, "spec/conformance/registry.yml")) }
  let(:package) do
    JSON.parse(File.read(File.join(REPO_ROOT, "app/assets/javascripts/shadcn/package.json")))
  end

  it "keeps the generated README inventory identical to the conformance registry" do
    generated = readme[/#{Regexp.escape(Documentation::ReadmeInventory::BEGIN_MARKER)}.*?#{Regexp.escape(Documentation::ReadmeInventory::END_MARKER)}/m]
    implemented = registry.reject { |_item, entry| entry["pending"] }
    public_components = implemented.values.flat_map do |entry|
      entry.fetch("exports").map { |export| export.fetch("component") }
    end.sort

    expect(generated).to eq(inventory.generated_section)
    expect(inventory.implemented_items).to eq(implemented.keys.sort)
    expect(inventory.public_components).to eq(public_components)
  end

  it "fails fast when an inventory marker is missing or duplicated" do
    Dir.mktmpdir("documentation-contract-") do |root|
      FileUtils.mkdir_p(File.join(root, "spec/conformance"))
      FileUtils.cp(File.join(REPO_ROOT, "spec/conformance/registry.yml"), File.join(root, "spec/conformance/registry.yml"))

      [
        "#{Documentation::ReadmeInventory::BEGIN_MARKER}\n",
        <<~MARKDOWN
          #{Documentation::ReadmeInventory::BEGIN_MARKER}
          #{Documentation::ReadmeInventory::BEGIN_MARKER}
          #{Documentation::ReadmeInventory::END_MARKER}
        MARKDOWN
      ].each do |contents|
        File.write(File.join(root, "README.md"), contents)

        expect { Documentation::ReadmeInventory.new(root:).check }.to raise_error(RuntimeError, /exactly one/)
      end
    end
  end

  it "regenerates only the marked inventory section" do
    Dir.mktmpdir("documentation-contract-") do |root|
      FileUtils.mkdir_p(File.join(root, "spec/conformance"))
      FileUtils.cp(File.join(REPO_ROOT, "spec/conformance/registry.yml"), File.join(root, "spec/conformance/registry.yml"))
      File.write(
        File.join(root, "README.md"),
        "before\n#{Documentation::ReadmeInventory::BEGIN_MARKER}\nstale\n#{Documentation::ReadmeInventory::END_MARKER}\nafter\n"
      )

      local_inventory = Documentation::ReadmeInventory.new(root:)
      local_inventory.generate

      expect(File.read(File.join(root, "README.md"))).to eq("before\n#{local_inventory.generated_section}\nafter\n")
    end
  end

  it "describes the style pinned by the vendored manifest" do
    style = JSON.parse(File.read(File.join(REPO_ROOT, "vendor/shadcn/manifest.json"))).dig("source", "style")
    gemspec = Gem::Specification.load(File.join(REPO_ROOT, "shadcn_view_components.gemspec"))

    expect(gemspec.description).to include("shadcn/ui (#{style})")
  end

  it "documents both JavaScript delivery modes using the distributed package contract" do
    package_name = package.fetch("name")
    package_path = ShadcnViewComponents::Generators::InstallGenerator::VENDORED_JAVASCRIPT_PATH
    modes = ShadcnViewComponents::Generators::JavascriptDeliveryMode::MODES

    expect(modes).to contain_exactly("importmap", "bundler")
    expect(readme).to include(
      "import { register } from \"#{package_name}\"",
      "bin/rails generate shadcn_view_components:install --javascript=bundler",
      "pnpm add ./#{package_path}",
      "npm install ./#{package_path}"
    )
    expect(package).to include("private" => true, "type" => "module", "exports" => include("." => "./index.js"))
  end
end
