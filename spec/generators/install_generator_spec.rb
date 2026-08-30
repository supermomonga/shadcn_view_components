# frozen_string_literal: true

require "active_support/testing/stream"
require "rails_helper"
require "shadcn_view_components"
require "generators/shadcn_view_components/install_generator"

RSpec.describe ShadcnViewComponents::Generators::InstallGenerator do
  include ActiveSupport::Testing::Stream

  let(:destination_root) { Dir.mktmpdir("shadcn-install-generator-") }
  let(:stylesheet) { "app/assets/stylesheets/application.css" }
  let(:stylesheet_path) { File.join(destination_root, stylesheet) }
  let(:import_directive) { '@import "shadcn/shadcn.css";' }
  let(:source_directive) { "@source \"#{REPO_ROOT}/app/components\";" }
  let(:managed_block) do
    <<~CSS
      /* shadcn_view_components */
      #{import_directive}
      #{source_directive}
    CSS
  end
  let(:base_import) { "@import \"tailwindcss\";\n" }

  after do
    FileUtils.remove_entry(destination_root)
  end

  {
    "both directives missing" => :none,
    "only the shadcn import present" => :import,
    "only the component source present" => :source,
    "both directives present in reverse order" => :both_reversed
  }.each do |description, initial_state|
    it "converges from #{description} and remains byte-identical on rerun" do
      write_stylesheet(initial_css_for(initial_state))

      expect_convergence_to("#{base_import}#{managed_block}")
    end
  end

  it "creates a missing stylesheet with the managed directives" do
    expect_convergence_to(managed_block)
  end

  it "deduplicates previously repeated managed directives" do
    write_stylesheet(<<~CSS)
      #{base_import.chomp}
      #{import_directive}
      #{source_directive}
      #{import_directive}
      #{source_directive}
    CSS

    expect_convergence_to("#{base_import}#{managed_block}")
  end

  it "canonicalizes an indented semicolonless source from an older gem path" do
    write_stylesheet(<<~CSS)
      #{base_import.chomp}
        @source "/bundle/gems/shadcn_view_components-0.0.1/app/components"
    CSS

    expect_convergence_to("#{base_import}#{managed_block}")
  end

  it "places the managed import before existing CSS rules" do
    existing_rule = ".host { color: red; }\n"
    write_stylesheet(existing_rule)

    expect_convergence_to("#{managed_block}#{existing_rule}")
  end

  it "does not treat an import string inside a comment as a directive" do
    existing_css = "/* docs: #{import_directive} */\n.host { color: red; }\n"
    write_stylesheet(existing_css)

    expect_convergence_to("/* docs: #{import_directive} */\n#{managed_block}.host { color: red; }\n")
  end

  define_method(:write_stylesheet) do |contents|
    FileUtils.mkdir_p(File.dirname(stylesheet_path))
    File.binwrite(stylesheet_path, contents)
  end

  define_method(:initial_css_for) do |state|
    case state
    when :import then "#{base_import}#{import_directive}\n"
    when :source then "#{base_import}#{source_directive}\n"
    when :both_reversed then "#{base_import}#{source_directive}\n#{import_directive}\n"
    else base_import
    end
  end

  define_method(:expect_convergence_to) do |expected|
    run_generator
    generated_once = File.binread(stylesheet_path)
    run_generator

    expect(generated_once).to eq(expected)
    expect(File.binread(stylesheet_path)).to eq(generated_once)
    expect(managed_directive_lines(generated_once)).to eq([import_directive, source_directive])
  end

  define_method(:managed_directive_lines) do |contents|
    contents.lines(chomp: true).select { |line| [import_directive, source_directive].include?(line) }
  end

  define_method(:run_generator) do
    capture(:stdout) do
      described_class.start(["--stylesheet", stylesheet], destination_root: destination_root)
    end
  end
end
