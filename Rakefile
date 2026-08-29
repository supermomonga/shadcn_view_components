# frozen_string_literal: true

require_relative "lib/shadcn_view_components/version"
require "rspec/core/rake_task"
require "rubocop/rake_task"

Dir[File.expand_path("lib/tasks/*.rake", __dir__)].each { |path| load path }

# フルスイート。spec/visual の visual parity も含まれる(upstreamサーバは自動起動)
RSpec::Core::RakeTask.new(:spec)
RuboCop::RakeTask.new

desc "Run the full local verification suite (mirrors CI)"
task verify: %w[shadcn:check sorbet:tc rubocop spec]

desc "Build the gem into pkg/"
task :build_gem do
  sh "gem build shadcn_view_components.gemspec -o pkg/shadcn_view_components-#{ShadcnViewComponents::VERSION}.gem"
end

task default: :verify
