# frozen_string_literal: true

# Sorbetの型検証タスク(08-sorbet §7)。CIと `rake verify` から実行される。
namespace :sorbet do
  desc "Run the Sorbet static type check (srb tc)"
  task :tc do
    sh "bundle exec srb tc" do |ok, _result|
      abort "srb tc failed" unless ok
    end
  end
end
