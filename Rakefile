# frozen_string_literal: true

require_relative "lib/shadcn_view_components/version"

Dir[File.expand_path("lib/tasks/*.rake", __dir__)].each { |path| load path }

desc "Run the full local verification suite (mirrors CI)"
task verify: %w[shadcn:check sorbet:tc rubocop spec]

desc "Build the gem into pkg/"
task :build_gem do
  sh "gem build shadcn_view_components.gemspec -o pkg/shadcn_view_components-#{ShadcnViewComponents::VERSION}.gem"
end

task default: :verify
