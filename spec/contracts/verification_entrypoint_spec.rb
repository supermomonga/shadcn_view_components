# frozen_string_literal: true

require "rails_helper"
require "open3"

RSpec.describe "verification entrypoints", type: :conformance do
  let(:ci_tasks) do
    {
      "lint-ruby" => "verify:rubocop",
      "lint-js" => "verify:javascript",
      "sorbet" => "verify:sorbet",
      "rspec" => "verify:spec",
      "system" => "verify:system",
      "parity" => "verify:parity",
      "determinism" => "verify:generated",
      "tailwind-build" => "verify:tailwind"
    }
  end

  it "provides the full task and every CI verification subtask" do
    output, status = Open3.capture2e("bundle", "exec", "rake", "-T", "verify")

    expect(status).to be_success
    expect(output).to include("rake verify ", "rake verify:full ")
    ci_tasks.each_value { |task| expect(output).to include("rake #{task} ") }
  end

  it "has each CI job call its matching local verification task" do
    workflow = YAML.safe_load_file(File.join(REPO_ROOT, ".github/workflows/ci.yml"), aliases: true)
    jobs = workflow.fetch("jobs")

    ci_tasks.each do |job_name, task|
      commands = jobs.fetch(job_name).fetch("steps").filter_map { |step| step["run"] }
      expect(commands).to include("bundle install"), "#{job_name} must install the Rake task dependencies"
      expect(commands.any? { |command| command.include?("bundle exec rake #{task}") }).to be(true), job_name
    end
  end

  it "runs every distributed JavaScript check through the local entrypoint" do
    rakefile = File.read(File.join(REPO_ROOT, "Rakefile"))
    package = JSON.parse(File.read(File.join(REPO_ROOT, "tools/js-consumer/package.json")))

    expect(rakefile).to include('sh "pnpm", "-C", "tools/js-consumer", "run", "verify"')
    expect(package.fetch("scripts")).to include(
      "lint" => include("eslint --max-warnings 0"),
      "typecheck" => include("tsc --project"),
      "test:unit" => include("vitest run"),
      "test:bundle" => include("node test.mjs"),
      "verify" => include("lint", "typecheck", "test:unit", "test:bundle")
    )
    expect(package.dig("dependencies", "@supermomonga/shadcn-view-components")).to eq(
      "link:fixture/vendor/shadcn-view-components"
    )
  end

  it "provides an executable setup script for every dependency set" do
    setup = File.join(REPO_ROOT, "bin/setup")
    contents = File.read(setup)

    expect(File.executable?(setup)).to be(true)
    expect(contents).to include(
      "mise install",
      "bundle install",
      "pnpm install --frozen-lockfile",
      "pnpm -C tools/extractor install --frozen-lockfile",
      "node tools/js-consumer/prepare.mjs",
      "pnpm -C tools/js-consumer install --frozen-lockfile",
      "pnpm -C tools/visual-parity install --frozen-lockfile"
    )
  end
end
