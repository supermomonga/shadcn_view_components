# frozen_string_literal: true

require "rails_helper"
require "open3"

RSpec.describe "JavaScript distribution", type: :conformance do
  let(:package_name) { "@supermomonga/shadcn-view-components" }
  let(:javascript_root) { ShadcnViewComponents::Engine.root.join("app/assets/javascripts/shadcn") }
  let(:importmap_path) { ShadcnViewComponents::Engine.root.join("config/importmap.rb") }

  it "ships one uniquely named ESM package and its importmap definition in the gem" do
    package = JSON.parse(File.read(javascript_root.join("package.json")))
    gemspec = Gem::Specification.load(File.join(REPO_ROOT, "shadcn_view_components.gemspec"))

    expect(package).to include(
      "name" => package_name,
      "type" => "module",
      "exports" => include(
        "." => "./index.js",
        "./controllers/*" => "./controllers/*.js",
        "./floating_position" => "./floating_position.js"
      )
    )
    expect(gemspec.files).to include(
      "config/importmap.rb",
      "app/assets/javascripts/shadcn/package.json"
    )
  end

  it "composes the engine map before importmap initializes and watches its JavaScript" do
    initializer = ShadcnViewComponents::Engine.initializers.find do |candidate|
      candidate.name == "shadcn_view_components.importmap"
    end

    expect(initializer&.before).to eq("importmap")
    expect(Rails.application.config.importmap.paths).to include(importmap_path)
    expect(Rails.application.config.importmap.cache_sweepers).to include(
      ShadcnViewComponents::Engine.root.join("app/assets/javascripts")
    )
  end

  it "pins the entry point, every controller, and shared helper under the package name" do
    imports = JSON.parse(
      Rails.application.importmap.to_json(resolver: ActionController::Base.helpers, cache_key: :distribution_spec)
    ).fetch("imports")
    expected_names = Dir[javascript_root.join("**/*.js")].map do |path|
      relative = Pathname(path).relative_path_from(javascript_root).to_s.delete_suffix(".js")
      suffix = relative == "index" ? nil : relative
      [package_name, suffix].compact.join("/")
    end

    expect(imports.keys).to include(*expected_names)
  end

  it "boots a Rails asset host without loading importmap-rails" do
    script = <<~RUBY
      require "rails"
      require "action_controller/railtie"
      require "action_view/railtie"
      require "propshaft"
      require File.expand_path("lib/shadcn_view_components", Dir.pwd)

      module BundledHost
        class Application < Rails::Application
          config.secret_key_base = "bundled-host-test"
          config.eager_load = false
        end
      end

      BundledHost::Application.initialize!
      raise "importmap was loaded in bundled host" if Rails.application.config.respond_to?(:importmap)
    RUBY
    stdout, stderr, status = Open3.capture3("bundle", "exec", "ruby", "-e", script, chdir: REPO_ROOT)

    expect(status).to be_success, "bundled host failed to boot:\n#{stdout}\n#{stderr}"
  end
end
