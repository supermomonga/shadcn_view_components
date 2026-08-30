# frozen_string_literal: true

require_relative "lib/shadcn_view_components/version"
require "rspec/core/rake_task"
require "rubocop/rake_task"

Dir[File.expand_path("lib/tasks/*.rake", __dir__)].each { |path| load path }

# フルスイート。spec/visual の visual parity も含まれる(upstreamサーバは自動起動)
RSpec::Core::RakeTask.new(:spec)
RuboCop::RakeTask.new

namespace :verify do
  desc "Verify generated contracts are deterministic"
  task :generated do
    Rake::Task["shadcn:check"].invoke
    Rake::Task["docs:check"].invoke
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
    sh "bundle", "exec", "rspec", "spec/visual"
  end

  desc "Verify all contract classes compile with Tailwind CSS"
  task :tailwind do
    sh "pnpm", "-C", "tools/extractor", "run", "tailwind:check"
  end

  desc "Run every verification required by CI"
  task full: %i[generated rubocop javascript sorbet spec system parity tailwind]
end

namespace :docs do
  desc "Generate the README component inventory"
  task :generate do
    ruby "tools/documentation/readme_inventory.rb", "generate"
  end

  desc "Verify the README component inventory is current"
  task :check do
    ruby "tools/documentation/readme_inventory.rb", "check"
  end
end

desc "Run every verification required by CI"
task verify: "verify:full"

desc "Build the gem into pkg/"
task :build_gem do
  sh "gem build shadcn_view_components.gemspec -o pkg/shadcn_view_components-#{ShadcnViewComponents::VERSION}.gem"
end

task default: :verify
