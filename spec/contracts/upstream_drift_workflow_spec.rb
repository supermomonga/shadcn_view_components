# frozen_string_literal: true

require "rails_helper"
require_relative "../../.github/scripts/render_upstream_sync_report"

RSpec.describe "upstream drift workflow", type: :conformance do
  let(:workflow_path) { File.join(REPO_ROOT, ".github/workflows/upstream-drift.yml") }
  let(:workflow_source) { File.read(workflow_path) }
  let(:workflow) { YAML.safe_load_file(workflow_path, aliases: true) }
  let(:steps) { workflow.fetch("jobs").fetch("sync-and-pr").fetch("steps") }

  define_method(:named_step) do |name|
    steps.find { |step| step["name"] == name }.tap do |step|
      raise KeyError, "missing workflow step: #{name}" unless step
    end
  end

  define_method(:step_index) do |name|
    steps.index(named_step(name))
  end

  it "uses one credential and explicitly dispatches normal CI for the PR head" do
    expect(workflow.fetch("permissions")).to include(
      "actions" => "write",
      "contents" => "write",
      "pull-requests" => "write"
    )
    expect(workflow_source).not_to include("SYNC_TOKEN", "continue-on-error", "|| github.token")

    checkout = steps.find { |step| step.fetch("uses", "").start_with?("actions/checkout@") }
    create_pr = named_step("Create / update the upstream-sync PR")
    dispatch = named_step("Run normal CI on the upstream-sync PR head")
    confirmation = named_step("Confirm every required CI check exists on the PR head")
    ready = named_step("Mark the verified upstream-sync PR ready for review")

    expect(checkout.fetch("with")).to include("persist-credentials" => false)
    expect(create_pr.fetch("with")).to include(
      "draft" => "always-true",
      "token" => "${{ github.token }}"
    )
    expect(dispatch.fetch("run")).to eq("gh workflow run ci.yml --ref \"$PR_BRANCH\"")
    expect(dispatch.fetch("env")).to include(
      "GH_TOKEN" => "${{ github.token }}",
      "PR_BRANCH" => "${{ steps.cpr.outputs.pull-request-branch }}"
    )
    expect(confirmation.fetch("env")).to include(
      "GH_TOKEN" => "${{ github.token }}",
      "PR_HEAD_SHA" => "${{ steps.cpr.outputs.pull-request-head-sha }}"
    )
    expect(confirmation.fetch("run")).to include(
      "--event workflow_dispatch --commit \"$PR_HEAD_SHA\"",
      "lint-ruby lint-js sorbet rspec system parity determinism tailwind-build",
      "Required CI checks were not created"
    )
    expect(ready.fetch("run")).to eq("gh pr ready \"$PR_NUMBER\" --repo \"$GITHUB_REPOSITORY\"")

    ci = YAML.safe_load_file(File.join(REPO_ROOT, ".github/workflows/ci.yml"), aliases: true)
    expect(ci.fetch(true)).to include("pull_request", "workflow_dispatch")
  end

  it "runs the complete failing-fast verification before creating a PR" do
    install = named_step("Install dependencies").fetch("run")
    verify = named_step("Run every required verification")

    expect(steps.any? { |step| step.fetch("uses", "").start_with?("browser-actions/setup-chrome@") }).to be(true)
    expect(install).to eq("bin/setup")
    expect(verify.fetch("run")).to include("bundle exec rake verify")
    expect(verify).not_to have_key("continue-on-error")
    expect(step_index("Detect upstream changes")).to be < step_index("Run every required verification")
    expect(step_index("Run every required verification")).to be < step_index("Create / update the upstream-sync PR")
    expect(step_index("Create / update the upstream-sync PR")).to be < step_index("Run normal CI on the upstream-sync PR head")
    expect(step_index("Run normal CI on the upstream-sync PR head")).to be < step_index("Confirm every required CI check exists on the PR head")
    expect(step_index("Confirm every required CI check exists on the PR head")).to be < step_index("Mark the verified upstream-sync PR ready for review")
  end

  it "does not hide stale-PR API failures" do
    close_step = named_step("Close stale sync PR when upstream is already in sync")

    expect(close_step.fetch("run")).to include("gh pr list", "gh pr close")
    expect(close_step.fetch("run")).not_to include("|| true")
  end

  it "renders full revision and verification evidence from a manifest fixture" do
    manifest = JSON.parse(File.read(File.join(REPO_ROOT, "spec/fixtures/upstream_sync_manifest.json")))
    report = UpstreamSyncReport.render(
      manifest: manifest,
      verification_outcome: "failure",
      run_url: "https://github.com/example/repository/actions/runs/123",
      changes: "vendor/shadcn/manifest.json | 2 +-",
      contracts: "gen/contracts/button.json | 1 +"
    )

    expect(report).to include(
      "shadcn@4.19.0",
      "1773ecfeeb4a04366978d353e69b5c7ded78dcb2",
      "c34a83ec7ac2e133729a680286f534c6ba973c1bbc52a14e654a98fc75b8252f",
      "2026-08-30T04:56:32.776Z",
      "❌ 失敗",
      "`bundle exec rake verify`",
      "https://github.com/example/repository/actions/runs/123",
      "vendor/shadcn/manifest.json | 2 +-",
      "gen/contracts/button.json | 1 +"
    )
  end
end
