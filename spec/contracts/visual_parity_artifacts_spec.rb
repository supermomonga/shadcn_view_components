# frozen_string_literal: true

require "rails_helper"

RSpec.describe ParityArtifacts, type: :conformance do
  it "writes an ordinary test run below ignored tmp storage" do
    root = described_class.output_root(env: {}, pid: 1234)

    expect(root).to eq(File.join(REPO_ROOT, "tmp/visual-parity/run-1234"))
    expect(root).not_to start_with(described_class::TRACKED_ROOT)
  end

  it "supports an explicit artifact directory without enabling baseline updates" do
    root = described_class.output_root(env: { "PARITY_ARTIFACTS_DIR" => "tmp/ci-parity" }, pid: 1234)

    expect(root).to eq(File.join(REPO_ROOT, "tmp/ci-parity"))
    expect(root).not_to eq(described_class::TRACKED_ROOT)
  end

  it "uses tracked baselines only through the explicit update switch" do
    root = described_class.output_root(env: { "PARITY_UPDATE_BASELINES" => "1" }, pid: 1234)

    expect(root).to eq(described_class::TRACKED_ROOT)
  end
end
