# frozen_string_literal: true

require "rails_helper"

RSpec.describe "visual parity harness", type: :conformance do
  it "keeps the static icon shim outside the ignored generated UI output" do
    gitignore = File.readlines(File.join(REPO_ROOT, ".gitignore"), chomp: true)
    unpack = File.read(File.join(REPO_ROOT, "tools/visual-parity/unpack.mjs"))
    shim = File.join(REPO_ROOT, "tools/visual-parity/src/components/icon-placeholder.tsx")

    expect(unpack).to include('"@/components/icon-placeholder"')
    expect(File).to exist(shim)
    expect(gitignore).to include("/tools/visual-parity/src/components/ui/")
    expect(gitignore).not_to include("/tools/visual-parity/src/components/")
  end
end
