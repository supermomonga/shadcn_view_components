# frozen_string_literal: true

require_relative "lib/shadcn_view_components/version"
require "bundler"
require "digest"
require "open3"
require "rspec/core/rake_task"
require "rubocop/rake_task"

Dir[File.expand_path("lib/tasks/*.rake", __dir__)].each { |path| load path }

# フルスイート。spec/visual の visual parity も含まれる(upstreamサーバは自動起動)
RSpec::Core::RakeTask.new(:spec)
RuboCop::RakeTask.new

git_output = lambda do |*arguments|
  stdout, stderr, status = Open3.capture3("git", *arguments, chdir: __dir__)
  abort stderr unless status.success?
  stdout
end

worktree_fingerprint = lambda do
  status = git_output.call("status", "--porcelain=v2", "--untracked-files=all", "-z")
  tracked_diff = git_output.call("diff", "--binary", "--no-ext-diff", "HEAD", "--")
  untracked_paths = git_output.call("ls-files", "--others", "--exclude-standard", "-z").split("\0").sort
  untracked = untracked_paths.map do |relative_path|
    path = File.join(__dir__, relative_path)
    stat = File.lstat(path)
    content =
      if stat.symlink?
        File.readlink(path)
      elsif stat.file?
        Digest::SHA256.file(path).hexdigest
      end
    [relative_path, stat.ftype, stat.mode, content]
  end

  [status, tracked_diff, untracked]
end

namespace :verify do
  desc "Verify generated contracts are deterministic"
  task :generated do
    before = worktree_fingerprint.call
    Rake::Task["shadcn:check"].invoke
    Rake::Task["docs:check"].invoke
    after = worktree_fingerprint.call
    abort "verify:generated changed the working tree" unless after == before
  end

  desc "Run Ruby lint"
  task :rubocop do
    Rake::Task["rubocop"].invoke
  end

  desc "Run extractor checks and all distributed JavaScript checks"
  task :javascript do
    sh "pnpm", "-C", "tools/extractor", "run", "typecheck"
    sh "pnpm", "-C", "tools/extractor", "run", "test"
    sh "pnpm", "-C", "tools/js-consumer", "run", "verify"
  end

  desc "Run Sorbet and verify gem RBI freshness"
  task :sorbet do
    Rake::Task["sorbet:tc"].invoke
    sh "bundle", "exec", "tapioca", "gem", "--verify"
  end

  desc "Run component, conformance, contract, generator, and request specs"
  task :spec do
    sh "bundle", "exec", "rspec", "spec/components", "spec/conformance", "spec/contracts", "spec/generators", "spec/requests"
  end

  desc "Run browser interaction specs"
  task :system do
    sh "bundle", "exec", "rspec", "spec/system"
  end

  desc "Run visual and animation parity specs"
  task :parity do
    sh "pnpm", "-C", "tools/visual-parity", "run", "test"
    sh "bundle", "exec", "rspec", "spec/visual"
  end

  desc "Verify the packaged Engine and all contract classes compile with Tailwind CSS"
  task :tailwind do
    sh "bundle", "exec", "rspec", "spec/contracts/tailwind_engine_distribution_spec.rb"
    if ENV["VERIFY_TAILWIND_MINIMUM"] == "1"
      minimum_environment = { "BUNDLE_GEMFILE" => File.join(__dir__, "gemfiles/tailwindcss_rails_4_3.gemfile") }
      Bundler.with_unbundled_env do
        sh minimum_environment, "bundle", "install"
        sh minimum_environment, "bundle", "exec", "rspec", "spec/contracts/tailwind_engine_distribution_spec.rb"
      end
    end
    sh "pnpm", "-C", "tools/extractor", "run", "tailwind:check"
  end

  desc "Run every verification required by CI"
  task full: %i[generated rubocop javascript sorbet spec system parity tailwind]
end

namespace :docs do
  desc "Generate the README inventory and component API reference"
  task :generate do
    ruby "tools/documentation/readme_inventory.rb", "generate"
    ruby "tools/documentation/component_reference.rb", "generate"
  end

  desc "Verify generated documentation is current"
  task :check do
    ruby "tools/documentation/readme_inventory.rb", "check"
    ruby "tools/documentation/component_reference.rb", "check"
  end
end

desc "Run every verification required by CI"
task verify: "verify:full"

desc "Build the gem into pkg/"
task :build_gem do
  sh "gem build shadcn_view_components.gemspec -o pkg/shadcn_view_components-#{ShadcnViewComponents::VERSION}.gem"
end

task default: :verify
