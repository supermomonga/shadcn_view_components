# frozen_string_literal: true

require "active_support/testing/stream"
require "rails_helper"
require "shadcn_view_components"
require "generators/shadcn_view_components/install_generator"

RSpec.describe ShadcnViewComponents::Generators::InstallGenerator do
  include ActiveSupport::Testing::Stream

  let(:destination_root) { Dir.mktmpdir("shadcn-install-generator-") }
  let(:stylesheet) { described_class::TAILWIND_STYLESHEET_PATH }
  let(:stylesheet_path) { File.join(destination_root, stylesheet) }
  let(:animate_import) { '@import "tw-animate-css";' }
  let(:engine_import) { '@import "../builds/tailwind/shadcn_view_components";' }
  let(:managed_block) do
    <<~CSS
      #{animate_import}

      /* shadcn_view_components */
      #{engine_import}
    CSS
  end
  let(:base_import) { "@import \"tailwindcss\";\n" }

  after do
    FileUtils.remove_entry(destination_root)
  end

  {
    "both directives missing" => :none,
    "only the animation import present" => :animate,
    "only the engine import present" => :engine,
    "both directives present in reverse order" => :both_reversed
  }.each do |description, initial_state|
    it "converges from #{description} and remains byte-identical on rerun" do
      write_stylesheet(initial_css_for(initial_state))

      expect_convergence_to("#{base_import}#{managed_block}")
    end
  end

  it "fails before writing when the tailwindcss-rails input is missing" do
    output = capture(:stderr) do
      described_class.start([], destination_root: destination_root)
    end

    expect(output).to include("#{stylesheet} was not found. Run `bin/rails tailwindcss:install` first.")
    expect(File.exist?(stylesheet_path)).to be(false)
  end

  it "deduplicates previously repeated managed directives" do
    write_stylesheet(<<~CSS)
      #{base_import.chomp}
      #{animate_import}
      #{engine_import}
      #{animate_import}
      #{engine_import}
    CSS

    expect_convergence_to("#{base_import}#{managed_block}")
  end

  it "canonicalizes indented semicolonless managed imports" do
    write_stylesheet(<<~CSS)
      #{base_import.chomp}
        @import "../builds/tailwind/shadcn_view_components"
        @import "tw-animate-css"
    CSS

    expect_convergence_to("#{base_import}#{managed_block}")
  end

  it "never writes a gem path or host @source directive" do
    write_stylesheet(base_import)

    run_generator

    generated = File.binread(stylesheet_path)
    expect(generated).not_to include(REPO_ROOT, "@source")
  end

  it "places the managed import before existing CSS rules" do
    existing_rule = ".host { color: red; }\n"
    write_stylesheet(existing_rule)

    expect_convergence_to("#{managed_block}#{existing_rule}")
  end

  it "does not treat an import string inside a comment as a directive" do
    existing_css = "/* docs: #{engine_import} */\n.host { color: red; }\n"
    write_stylesheet(existing_css)

    expect_convergence_to("/* docs: #{engine_import} */\n#{managed_block}.host { color: red; }\n")
  end

  it "vendors one reproducible ESM package for bundler hosts" do
    write_stylesheet(base_import)
    output = run_generator(javascript: "bundler")
    vendored_package = File.join(destination_root, "vendor/shadcn_view_components/javascript")
    stale_file = File.join(vendored_package, "stale.js")

    expect(output).to include(
      'import { register } from "@supermomonga/shadcn-view-components"',
      "pnpm add ./vendor/shadcn_view_components/javascript",
      "npm install ./vendor/shadcn_view_components/javascript"
    )
    expect(output).not_to include('from "<absolute path>')
    expect(package_files(vendored_package)).to eq(package_files(File.join(REPO_ROOT, "app/assets/javascripts/shadcn")))

    File.write(stale_file, "stale")
    run_generator(javascript: "bundler")
    expect(File.exist?(stale_file)).to be(false)
    expect(package_files(vendored_package)).to eq(package_files(File.join(REPO_ROOT, "app/assets/javascripts/shadcn")))
  end

  it "does not mutate the vendored package in pretend mode" do
    write_stylesheet(base_import)
    vendored_package = File.join(destination_root, "vendor/shadcn_view_components/javascript")
    marker = File.join(vendored_package, "marker")
    FileUtils.mkdir_p(vendored_package)
    File.write(marker, "keep")

    run_generator(javascript: "bundler", pretend: true)

    expect(File.binread(marker)).to eq("keep")
    expect(File.exist?(File.join(vendored_package, "package.json"))).to be(false)
    expect(File.binread(stylesheet_path)).to eq(base_import)
  end

  it "removes the generator-managed package when revoked" do
    write_stylesheet(base_import)
    vendored_package = File.join(destination_root, "vendor/shadcn_view_components/javascript")
    run_generator(javascript: "bundler")
    File.write(File.join(vendored_package, "stale.js"), "stale")

    run_generator(javascript: "bundler", behavior: :revoke)

    expect(File.exist?(vendored_package)).to be(false)
  end

  it "rejects an unknown JavaScript delivery mode before changing files" do
    expect { run_generator(javascript: "unknown") }.to raise_error(ArgumentError, /unknown JavaScript delivery mode/)
    expect(File.exist?(stylesheet_path)).to be(false)
  end

  define_method(:write_stylesheet) do |contents|
    FileUtils.mkdir_p(File.dirname(stylesheet_path))
    File.binwrite(stylesheet_path, contents)
  end

  define_method(:initial_css_for) do |state|
    case state
    when :animate then "#{base_import}#{animate_import}\n"
    when :engine then "#{base_import}#{engine_import}\n"
    when :both_reversed then "#{base_import}#{engine_import}\n#{animate_import}\n"
    else base_import
    end
  end

  define_method(:expect_convergence_to) do |expected|
    run_generator
    generated_once = File.binread(stylesheet_path)
    run_generator

    expect(generated_once).to eq(expected)
    expect(File.binread(stylesheet_path)).to eq(generated_once)
    expect(managed_directive_lines(generated_once)).to eq([animate_import, engine_import])
  end

  define_method(:managed_directive_lines) do |contents|
    contents.lines(chomp: true).select { |line| [animate_import, engine_import].include?(line) }
  end

  define_method(:package_files) do |root|
    Dir[File.join(root, "**/*")].select { |path| File.file?(path) }.to_h do |path|
      [path.delete_prefix("#{root}/"), File.binread(path)]
    end
  end

  define_method(:run_generator) do |javascript: nil, pretend: false, behavior: :invoke|
    arguments = []
    arguments.push("--javascript", javascript) if javascript
    arguments.push("--pretend") if pretend
    capture(:stdout) do
      described_class.start(arguments, destination_root: destination_root, behavior: behavior)
    end
  end
end
