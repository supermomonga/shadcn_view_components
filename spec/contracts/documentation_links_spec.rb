# frozen_string_literal: true

require "rails_helper"
require "open3"
require "uri"

module DocumentationLinkContract
  INLINE_LINK = /\[[^\]\n]+\]\(\s*(?:<(?<angled>[^>\n]+)>|(?<plain>[^)\s]+))(?:\s+[^)\n]+)?\s*\)/
  REFERENCE_DEFINITION = /^ {0,3}\[[^\]\n]+\]:\s*(?:<(?<angled>[^>\n]+)>|(?<plain>\S+))/
  EXTERNAL_DESTINATION = %r{\A(?:[a-z][a-z0-9+.-]*:|//)}i

  module_function

  def destinations(markdown)
    prose_markdown = prose(markdown)
    prose_markdown.scan(INLINE_LINK).map { |angled, plain| angled || plain } +
      prose_markdown.scan(REFERENCE_DEFINITION).map { |angled, plain| angled || plain }
  end

  def external?(destination)
    destination.match?(EXTERNAL_DESTINATION)
  end

  def prose(markdown)
    fence = nil

    markdown.each_line.filter_map do |line|
      if fence
        fence = nil if closing_fence?(line, fence)
        next
      end

      opening = line.match(/\A {0,3}(?<marker>`{3,}|~{3,})/)
      if opening
        marker = opening[:marker]
        fence = [marker[0], marker.length]
        next
      end

      line.gsub(/`+[^`\n]*`+/, "")
    end.join
  end

  def closing_fence?(line, fence)
    character, minimum_length = fence
    line.match?(/\A {0,3}#{Regexp.escape(character)}{#{minimum_length},}[ \t]*\r?\n?\z/)
  end
end

RSpec.describe "documentation local links" do
  let(:tracked_paths) do
    stdout, stderr, status = Open3.capture3("git", "ls-files", "-z", chdir: REPO_ROOT)
    raise "git ls-files failed: #{stderr}" unless status.success?

    stdout.split("\0")
  end

  let(:document_paths) do
    tracked_paths.select { |path| path == "README.md" || path.match?(%r{\Adocs/.+\.md\z}) }.sort
  end

  it "extracts owned Markdown links without treating code samples as links" do
    markdown = <<~MARKDOWN
      [guide](docs/guide.md) and [site](https://example.com)
      [reference]: docs/reference.md
      `[inline code](docs/not-a-link.md)`

      ```markdown
      [fenced code](docs/not-a-link-either.md)
      ```
    MARKDOWN

    expect(DocumentationLinkContract.destinations(markdown)).to contain_exactly(
      "docs/guide.md",
      "https://example.com",
      "docs/reference.md"
    )
  end

  it "contains no references to the untracked docs.local directory" do
    offenders = document_paths.select do |path|
      File.read(File.join(REPO_ROOT, path)).include?("docs.local/")
    end

    expect(offenders).to be_empty, "docs.local references remain in: #{offenders.join(', ')}"
  end

  it "keeps every local Markdown link inside the repository and tracked by git" do
    failures = document_paths.flat_map do |source_path|
      source = File.read(File.join(REPO_ROOT, source_path))
      DocumentationLinkContract.destinations(source).filter_map do |destination|
        next if DocumentationLinkContract.external?(destination)

        validate_local_destination(source_path, destination)
      end
    end

    expect(failures).to be_empty, "invalid local documentation links:\n#{failures.join("\n")}"
  end

  define_method(:validate_local_destination) do |source_path, destination|
    raw_path = destination.split(/[?#]/, 2).first
    decoded_path = URI::DEFAULT_PARSER.unescape(raw_path)
    decoded_path = source_path if decoded_path.empty?
    absolute_path = File.expand_path(decoded_path, File.dirname(File.join(REPO_ROOT, source_path)))
    root_prefix = "#{REPO_ROOT}/"

    return "#{source_path}: #{destination} escapes the repository" unless absolute_path.start_with?(root_prefix)

    relative_path = absolute_path.delete_prefix(root_prefix)
    return "#{source_path}: #{destination} does not exist" unless File.exist?(absolute_path)
    return "#{source_path}: #{destination} is not tracked by git" unless tracked_paths.include?(relative_path)

    nil
  end
end
