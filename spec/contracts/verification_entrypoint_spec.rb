# frozen_string_literal: true

require "rails_helper"
require "open3"

RSpec.describe "verification entrypoints", type: :conformance do
  let(:workflow) do
    YAML.safe_load_file(File.join(REPO_ROOT, ".github/workflows/ci.yml"), aliases: true)
  end

  let(:ci_jobs) { workflow.fetch("jobs") }

  let(:ci_tasks) do
    ci_jobs.transform_values { |job| job.fetch("env", {})["LOCAL_VERIFY_TASK"] }
  end

  let(:configured_ci_tasks) { ci_tasks.values.compact }

  let(:verification_command_pattern) do
    /\A(?:CHROME_BIN=\$\(which chrome\) )?bundle exec rake "\$LOCAL_VERIFY_TASK"\z/
  end

  it "provides the full task and every CI verification subtask" do
    output, status = Open3.capture2e("bundle", "exec", "rake", "-T", "verify", chdir: REPO_ROOT)

    expect(status).to be_success, output
    expect(output).to include("rake verify ", "rake verify:full ")
    configured_ci_tasks.each { |task| expect(output).to include("rake #{task} ") }
  end

  it "requires every CI job to declare and call its local verification task" do
    missing_tasks = ci_tasks.filter_map { |job_name, task| job_name if task.nil? || task.empty? }
    invalid_tasks = ci_tasks.filter_map { |job_name, task| job_name unless task&.match?(/\Averify:[a-z][a-z0-9_-]*\z/) }
    missing_message = "every CI job must declare env.LOCAL_VERIFY_TASK: #{missing_tasks.join(', ')}"
    invalid_message = "LOCAL_VERIFY_TASK must name one verify:* Rake task: #{invalid_tasks.join(', ')}"

    expect(missing_tasks).to be_empty, missing_message
    expect(invalid_tasks).to be_empty, invalid_message

    ci_tasks.each do |job_name, task|
      steps = ci_jobs.fetch(job_name).fetch("steps")
      commands = steps.filter_map { |step| step["run"] }
      invocation_message = "#{job_name} must invoke #{task} through LOCAL_VERIFY_TASK"
      invalid_steps = steps.each_with_index.filter_map do |step, index|
        id = step["id"]
        "#{job_name}.steps[#{index}]" unless id == "verification" || id&.match?(/\A(?:setup|artifact)_[a-z0-9_]+\z/)
      end
      verification_steps = steps.select { |step| step["id"] == "verification" }
      classification_message = <<~MESSAGE.chomp
        every non-verification CI step must be classified as setup_* or artifact_*: #{invalid_steps.join(', ')}
      MESSAGE

      expect(invalid_steps).to be_empty, classification_message
      expect(verification_steps.length).to eq(1), "#{job_name} must have exactly one verification step"
      expect(verification_steps.first.fetch("env", {})).not_to have_key("LOCAL_VERIFY_TASK")
      expect(commands).to include("bundle install"), "#{job_name} must install the Rake task dependencies"
      expect(verification_steps.first.fetch("run").strip).to match(verification_command_pattern), invocation_message
    end
  end

  it "routes verify through verify:full and runs exactly every CI verification task" do
    script = <<~RUBY
      load "Rakefile"
      puts JSON.generate(
        "verify" => Rake::Task["verify"].prerequisite_tasks.map(&:name),
        "full" => Rake::Task["verify:full"].prerequisite_tasks.map(&:name)
      )
    RUBY
    output, status = Open3.capture2e(
      "bundle", "exec", "ruby", "-rrake", "-rjson", "-e", script,
      chdir: REPO_ROOT
    )

    expect(status).to be_success, output
    rake_tasks = JSON.parse(output.lines.last)
    expect(rake_tasks.fetch("verify")).to eq(["verify:full"])
    expect(rake_tasks.fetch("full").sort).to eq(configured_ci_tasks.uniq.sort)
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
