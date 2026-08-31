# frozen_string_literal: true

require "bundler"
require "open3"
require "rails_helper"

TAILWIND_ENGINE_CSS_PATH = "app/assets/tailwind/shadcn_view_components/engine.css"
TAILWIND_ENGINE_EXPECTED_SELECTORS = [
  ".animate-spin",
  ".in-data-\\[slot\\=card-content\\]\\:bg-transparent",
  ".top-\\[60\\%\\]",
  ".px-4",
  ".py-3"
].freeze

RSpec.describe "Tailwind Engine distribution" do
  it "packages the Engine entry point and declares the supported tailwindcss-rails version" do
    specification = Gem::Specification.load(File.join(REPO_ROOT, "shadcn_view_components.gemspec"))
    dependency = specification.runtime_dependencies.find { |candidate| candidate.name == "tailwindcss-rails" }

    expect(specification.files).to include(TAILWIND_ENGINE_CSS_PATH)
    expect(dependency&.requirement).to eq(Gem::Requirement.new(">= 4.3"))
  end

  it "keeps every distributed source relative to the Engine entry point" do
    engine_css = File.binread(File.join(REPO_ROOT, TAILWIND_ENGINE_CSS_PATH))

    expect(engine_css).to include(
      '@import "../../stylesheets/shadcn/shadcn.css";',
      '@source "../../../../lib/shadcn_view_components/generated/contracts/**/*.rb";',
      '@source "../../../../lib/shadcn_view_components/contracts/**/*.rb";',
      '@source "../../../components/**/*.rb";',
      '@source "../../../components/**/*.erb";',
      '@source "../../javascripts/shadcn/**/*.js";'
    )
    expect(engine_css).not_to match(%r{@source\s+["']/})
  end

  it "builds all distributed class sources through the installed gem Engine entry point" do
    Dir.mktmpdir("shadcn-engine-consumer-") do |root|
      gem_file = build_gem(root)
      installed_gems = File.join(root, "arbitrary-installed-gems")
      consumer_root = File.join(root, "consumer")
      install_gem(gem_file, installed_gems)
      prepare_consumer(consumer_root)

      stdout, stderr, status = run_consumer(consumer_root, installed_gems, root)

      expect(status).to be_success, stderr
      installed_engine_root = stdout.lines.last&.strip
      expect(installed_engine_root).to start_with(File.realpath(installed_gems))

      wrapper = File.binread(File.join(consumer_root, "app/assets/builds/tailwind/shadcn_view_components.css"))
      expect(wrapper).to include(File.join(installed_engine_root, TAILWIND_ENGINE_CSS_PATH))

      compiled = File.binread(File.join(consumer_root, "app/assets/builds/tailwind.css"))
      TAILWIND_ENGINE_EXPECTED_SELECTORS.each { |selector| expect(compiled).to include(selector) }
    end
  end

  define_method(:build_gem) do |root|
    gem_file = File.join(root, "shadcn_view_components.gem")
    _stdout, stderr, status = Open3.capture3(
      Gem.ruby,
      "-S",
      "gem",
      "build",
      "shadcn_view_components.gemspec",
      "--output",
      gem_file,
      chdir: REPO_ROOT
    )
    raise stderr unless status.success?

    gem_file
  end

  define_method(:install_gem) do |gem_file, installed_gems|
    Bundler.with_unbundled_env do
      _stdout, stderr, status = Open3.capture3(
        Gem.ruby,
        "-S",
        "gem",
        "install",
        gem_file,
        "--install-dir",
        installed_gems,
        "--ignore-dependencies",
        "--no-document"
      )
      raise stderr unless status.success?
    end
  end

  define_method(:prepare_consumer) do |consumer_root|
    FileUtils.mkdir_p(File.join(consumer_root, "app/assets/tailwind"))
    FileUtils.mkdir_p(File.join(consumer_root, "app/assets/builds"))
    FileUtils.ln_s(File.join(REPO_ROOT, "node_modules"), File.join(consumer_root, "node_modules"))
    File.binwrite(
      File.join(consumer_root, "app/assets/tailwind/application.css"),
      <<~CSS
        @import "tailwindcss";
        @import "tw-animate-css";

        /* shadcn_view_components */
        @import "../builds/tailwind/shadcn_view_components";
      CSS
    )
  end

  define_method(:consumer_script) do
    <<~RUBY
      require "logger"
      require "pathname"
      require "rake"

      gem "tailwindcss-rails", ENV.fetch("TAILWINDCSS_RAILS_VERSION")
      require "rails"
      require "action_controller/railtie"
      require "action_view/railtie"
      require "propshaft"
      require "tailwindcss-rails"
      require "shadcn_view_components"

      class ConsumerApplication < Rails::Application
        config.root = Pathname(ENV.fetch("CONSUMER_ROOT"))
        config.eager_load = false
        config.secret_key_base = "tailwind-engine-contract"
        config.logger = Logger.new(nil)
      end

      ConsumerApplication.initialize!
      ConsumerApplication.load_tasks
      Rake::Task["tailwindcss:engines"].invoke
      Rake::Task["tailwindcss:build"].invoke
      puts ShadcnViewComponents::Engine.root.realpath
    RUBY
  end

  define_method(:consumer_environment) do |consumer_root, installed_gems|
    current_gem_paths = Gem.path.join(File::PATH_SEPARATOR)
    {
      "BUNDLE_GEMFILE" => nil,
      "CONSUMER_ROOT" => consumer_root,
      "GEM_HOME" => installed_gems,
      "GEM_PATH" => [installed_gems, current_gem_paths].join(File::PATH_SEPARATOR),
      "TAILWINDCSS_RAILS_VERSION" => Gem.loaded_specs.fetch("tailwindcss-rails").version.to_s
    }
  end

  define_method(:run_consumer) do |consumer_root, installed_gems, root|
    script = File.join(root, "consumer.rb")
    File.binwrite(script, consumer_script)

    Bundler.with_unbundled_env do
      Open3.capture3(consumer_environment(consumer_root, installed_gems), Gem.ruby, script, chdir: consumer_root)
    end
  end
end
