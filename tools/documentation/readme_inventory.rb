# frozen_string_literal: true

require "yaml"

module Documentation
  class ReadmeInventory
    BEGIN_MARKER = "<!-- BEGIN GENERATED COMPONENT INVENTORY -->"
    END_MARKER = "<!-- END GENERATED COMPONENT INVENTORY -->"

    def initialize(root: File.expand_path("../..", __dir__))
      @root = root
    end

    def generate
      File.write(readme_path, generated_readme)
    end

    def check
      return if File.read(readme_path) == generated_readme

      raise "README component inventory is stale; run `bundle exec rake docs:generate`"
    end

    def generated_section
      <<~MARKDOWN.chomp
        #{BEGIN_MARKER}
        - 提供範囲（[適合試験registry](spec/conformance/registry.yml)から生成）: **実装済み #{implemented_items.length} アイテム / 描画可能な公開 ViewComponent #{public_components.length} クラス**
        - 実装済みアイテム:
          #{implemented_items.map { |item| "`#{item}`" }.join(', ')}
        #{END_MARKER}
      MARKDOWN
    end

    def implemented_items
      registry.reject { |_item, entry| entry["pending"] }.keys.sort
    end

    def public_components
      registry.filter_map do |_item, entry|
        next if entry["pending"]

        entry.fetch("exports", [entry]).map { |export| export.fetch("component") }
      end.flatten.sort
    end

    private

    def generated_readme
      contents = File.read(readme_path)
      begin_count = contents.scan(BEGIN_MARKER).length
      end_count = contents.scan(END_MARKER).length
      raise "README must contain exactly one #{BEGIN_MARKER} and one #{END_MARKER}" unless begin_count == 1 && end_count == 1

      pattern = /#{Regexp.escape(BEGIN_MARKER)}.*?#{Regexp.escape(END_MARKER)}/m
      contents.sub(pattern, generated_section)
    end

    def registry
      @registry ||= YAML.safe_load_file(File.join(@root, "spec/conformance/registry.yml"))
    end

    def readme_path
      File.join(@root, "README.md")
    end
  end
end

if $PROGRAM_NAME == __FILE__
  command = ARGV.fetch(0, "check")
  inventory = Documentation::ReadmeInventory.new
  case command
  when "generate" then inventory.generate
  when "check" then inventory.check
  else raise ArgumentError, "unknown command #{command.inspect} (valid: generate, check)"
  end
end
