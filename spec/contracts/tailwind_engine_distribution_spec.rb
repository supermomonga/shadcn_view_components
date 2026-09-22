# frozen_string_literal: true

require "bundler"
require "open3"
require "rails_helper"
require "rubygems/package"

TAILWIND_ENGINE_CSS_PATH = "app/assets/tailwind/shadcn_view_components/engine.css"
TAILWIND_ENGINE_EXPECTED_SELECTORS = [
  ".animate-spin",
  ".in-data-\\[slot\\=card-content\\]\\:bg-transparent",
  ".top-\\[60\\%\\]",
  ".px-4",
  ".py-3"
].freeze

RSpec.describe "Packaged gem consumer and Tailwind Engine distribution" do
  it "packages the Engine entry point and declares the supported tailwindcss-rails version" do
    specification = Gem::Specification.load(File.join(REPO_ROOT, "shadcn_view_components.gemspec"))
    dependency = specification.runtime_dependencies.find { |candidate| candidate.name == "tailwindcss-rails" }

    expect(specification.files).to include(TAILWIND_ENGINE_CSS_PATH)
    expect(dependency&.requirement).to eq(Gem::Requirement.new("~> 4.3"))
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

  before(:context) do
    @package_root = Dir.mktmpdir("shadcn-engine-consumer-")
    @gem_file = build_gem(@package_root)
    @installed_gems = File.join(@package_root, "arbitrary-installed-gems")
    install_gem(@gem_file, @installed_gems)
  end

  after(:context) do
    FileUtils.remove_entry(@package_root)
  end

  let(:package) { Gem::Package.new(@gem_file) }

  it "ships documentation, licenses, and runtime files without development directories" do
    expect(package.contents).to include(
      "README.md", "CHANGELOG.md", "LICENSE", "lib/shadcn_view_components.rb",
      "lib/generators/shadcn_view_components/install_generator.rb", "config/importmap.rb",
      "app/components/shadcn/button.html.erb", "app/assets/javascripts/shadcn/index.js",
      "app/assets/stylesheets/shadcn/shadcn.css", TAILWIND_ENGINE_CSS_PATH
    )
    expect(package.contents.grep(%r{\A(?:docs|spec|tools|node_modules)/})).to be_empty
  end

  it "ships MIT metadata and distinct project links" do
    expect(package.spec.license).to eq("MIT")
    expect(package.spec.homepage).to eq("https://github.com/supermomonga/shadcn_view_components")
    expect(package.spec.metadata).to eq(
      "source_code_uri" => "https://github.com/supermomonga/shadcn_view_components",
      "documentation_uri" => "https://github.com/supermomonga/shadcn_view_components/blob/main/docs/reference/README.md",
      "bug_tracker_uri" => "https://github.com/supermomonga/shadcn_view_components/issues",
      "changelog_uri" => "https://github.com/supermomonga/shadcn_view_components/blob/main/CHANGELOG.md",
      "rubygems_mfa_required" => "true"
    )
  end

  %w[importmap bundler].each do |mode|
    context "with an installed gem in a #{mode} consumer" do
      before(:context) do
        @consumer_root = File.join(@package_root, "consumer-#{mode}")
        prepare_consumer(@consumer_root)
        stdout, stderr, status = run_consumer(@consumer_root, @installed_gems, mode)
        raise "#{mode} consumer failed:\n#{stdout}\n#{stderr}" unless status.success?

        @report = JSON.parse(stdout.lines.last)
      end

      let(:report) { @report }
      let(:installed_root) { report.fetch("engine_root") }
      let(:assets) { report.fetch("assets") }

      it "loads the gem and its sources from the install directory without checkout code" do
        expect(installed_root).to start_with("#{File.realpath(@installed_gems)}/gems/")
        expect(report.fetch("gem_root")).to eq(installed_root)
        expect(report.fetch("sources")).to all(start_with("#{installed_root}/"))
        expect(report.fetch("checkout_features")).to be_empty
      end

      it "uses the dependency versions resolved by the current verification bundle" do
        expect(report.fetch("versions")).to include(consumer_dependencies.transform_values { |spec| spec.version.to_s })
      end

      it "installs the original documentation and both MIT copyright notices" do
        %w[README.md CHANGELOG.md LICENSE].each do |path|
          expect(File.binread(File.join(installed_root, path))).to eq(File.binread(File.join(REPO_ROOT, path)))
        end
        license = File.read(File.join(installed_root, "LICENSE"))
        expect(license).to include(
          "Copyright (c) 2026 supermomonga", "Copyright (c) 2023 shadcn",
          "Permission is hereby granted", 'THE SOFTWARE IS PROVIDED "AS IS"'
        )
      end

      it "discovers the installer and generates portable CSS idempotently" do
        css = File.binread(File.join(@consumer_root, "app/assets/tailwind/application.css"))
        expect(css).to eq(<<~CSS)
          @import "tailwindcss";
          @import "tw-animate-css";

          /* shadcn_view_components */
          @import "../builds/tailwind/shadcn_view_components";
        CSS
        expect(report.fetch("generated_css")).to eq(css)
        expect(css).not_to include(installed_root, REPO_ROOT, "@source")
      end

      it "delivers JavaScript for the selected host mode" do
        vendored = File.join(@consumer_root, "vendor/shadcn_view_components/javascript")
        if mode == "bundler"
          expect(directory_contents(vendored)).to eq(directory_contents(File.join(installed_root, "app/assets/javascripts/shadcn")))
          expect(report.fetch("imports")).to be_nil
        else
          expect(File.exist?(vendored)).to be(false)
          expect(report.fetch("imports")).to include(
            "@supermomonga/shadcn-view-components" => assets.fetch("shadcn/index.js").fetch("url"),
            "@supermomonga/shadcn-view-components/controllers/calendar_controller" => assets.fetch("shadcn/controllers/calendar_controller.js").fetch("url")
          )
        end
      end

      it "resolves JavaScript and CSS assets from the installed Engine" do
        expect(assets.keys).to include("shadcn/index.js", "shadcn/controllers/calendar_controller.js", "shadcn/shadcn.css")
        assets.each_value do |asset|
          expect(asset.fetch("path")).to start_with("#{installed_root}/app/assets/")
          expect(asset.fetch("url")).to match(%r{\A/assets/shadcn/.+-[a-f0-9]+\.(js|css)\z})
        end
      end

      it "renders Button using its packaged template and generated contract" do
        button = Nokogiri::HTML.fragment(report.fetch("button")).at_css("button[data-slot='button']")
        expect(button).not_to be_nil
        expect(button.text).to eq("Packaged button")
        expect(button["class"].split).to include("inline-flex")
      end

      it "renders Calendar using its Ruby implementation and individual contract" do
        calendar = Nokogiri::HTML.fragment(report.fetch("calendar"))
        expect(calendar.at_css("[data-slot='calendar-grid'][role='grid']")).not_to be_nil
        expect(calendar.at_css("[aria-selected='true'] [data-day='2026-08-27']")).not_to be_nil
      end

      it "builds all distributed class sources through the installed Engine entry point" do
        wrapper = File.binread(File.join(@consumer_root, "app/assets/builds/tailwind/shadcn_view_components.css"))
        expect(wrapper).to include(File.join(installed_root, TAILWIND_ENGINE_CSS_PATH))
        compiled = File.binread(File.join(@consumer_root, "app/assets/builds/tailwind.css"))
        TAILWIND_ENGINE_EXPECTED_SELECTORS.each { |selector| expect(compiled).to include(selector) }
      end
    end
  end

  define_method(:directory_contents) do |root|
    Dir[File.join(root, "**/*")].select { |path| File.file?(path) }.to_h do |path|
      [path.delete_prefix("#{root}/"), File.binread(path)]
    end
  end

  define_method(:build_gem) do |root|
    gem_file = File.join(root, "shadcn_view_components.gem")
    _stdout, stderr, status = Open3.capture3(
      Gem.ruby,
      "-S",
      "gem",
      "build",
      "--strict",
      "shadcn_view_components.gemspec",
      "--output",
      gem_file,
      chdir: REPO_ROOT
    )
    raise stderr unless status.success?

    expect(stderr).not_to include("WARNING:")

    gem_file
  end

  define_method(:install_gem) do |gem_file, installed_gems|
    Bundler.with_unbundled_env do
      _stdout, stderr, status = Open3.capture3(
        Gem.ruby,
        "-S",
        "gem",
        "install",
        "--local",
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
      "@import \"tailwindcss\";\n"
    )
  end

  # 依存を先に固定してから親gemをactivateし、自動解決による現在版/下限版の混在を防ぐ。
  # 開発依存はconsumerへ持ち込まず、hostに必要なgemとそのruntime依存だけを使う。
  define_method(:consumer_dependencies) do
    resolved = Bundler.load.specs.to_h { |spec| [spec.name, spec] }
    ordered = {}
    visit = lambda do |name|
      next if ordered.key?(name)

      spec = resolved.fetch(name)
      spec.runtime_dependencies.each { |dependency| visit.call(dependency.name) }
      ordered[name] = spec
    end
    %w[shadcn_view_components propshaft importmap-rails rake].each { |name| visit.call(name) }
    ordered
  end

  define_method(:consumer_environment) do |consumer_root, installed_gems, mode|
    current_gem_paths = Gem.path.join(File::PATH_SEPARATOR)
    {
      "BUNDLE_GEMFILE" => nil,
      "CONSUMER_ROOT" => consumer_root,
      "CHECKOUT_ROOT" => File.realpath(REPO_ROOT),
      "JAVASCRIPT_MODE" => mode,
      "GEM_HOME" => installed_gems,
      "GEM_PATH" => [installed_gems, current_gem_paths].join(File::PATH_SEPARATOR),
      "RUBYLIB" => nil,
      "RUBYOPT" => nil
    }
  end

  define_method(:run_consumer) do |consumer_root, installed_gems, mode|
    script = File.join(consumer_root, "consumer.rb")
    activations = consumer_dependencies.map { |name, spec| "gem #{name.inspect}, #{spec.version.to_s.inspect}\n" }.join
    File.binwrite(script, activations + File.binread(File.join(REPO_ROOT, "spec/fixtures/gem_consumer.rb")))

    Bundler.with_unbundled_env do
      Open3.capture3(consumer_environment(consumer_root, installed_gems, mode), Gem.ruby, script, chdir: consumer_root)
    end
  end
end
