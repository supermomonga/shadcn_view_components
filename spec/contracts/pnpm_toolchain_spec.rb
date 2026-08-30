# frozen_string_literal: true

require "rails_helper"

RSpec.describe "pnpm toolchain configuration", type: :conformance do
  let(:pnpm_version) { "10.22.0" }
  let(:package_files) do
    %w[
      package.json
      tools/extractor/package.json
      tools/js-consumer/package.json
      tools/visual-parity/package.json
    ]
  end

  it "pins the same pnpm version for mise and every JavaScript project" do
    mise = File.read(File.join(REPO_ROOT, "mise.toml"))
    expect(mise).to match(/^pnpm = "#{Regexp.escape(pnpm_version)}"$/)

    package_files.each do |relative_path|
      package = JSON.parse(File.read(File.join(REPO_ROOT, relative_path)))
      expect(package.fetch("packageManager")).to eq("pnpm@#{pnpm_version}"), relative_path
    end
  end

  it "allows only the dependency builds required by each tool" do
    extractor = YAML.safe_load_file(File.join(REPO_ROOT, "tools/extractor/pnpm-workspace.yaml"))
    js_consumer = YAML.safe_load_file(File.join(REPO_ROOT, "tools/js-consumer/pnpm-workspace.yaml"))
    visual_parity = YAML.safe_load_file(File.join(REPO_ROOT, "tools/visual-parity/pnpm-workspace.yaml"))

    expect(extractor).to include(
      "strictDepBuilds" => true,
      "onlyBuiltDependencies" => %w[@parcel/watcher esbuild]
    )
    expect(visual_parity).to include(
      "strictDepBuilds" => true,
      "onlyBuiltDependencies" => %w[esbuild]
    )
    expect(js_consumer).to include(
      "strictDepBuilds" => true,
      "onlyBuiltDependencies" => %w[esbuild]
    )
  end
end
