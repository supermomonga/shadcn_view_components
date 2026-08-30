# frozen_string_literal: true

module AccessibilityHelpers
  AXE_SOURCE_PATH = File.expand_path("../../node_modules/axe-core/axe.min.js", __dir__)
  WCAG_TAGS = %w[wcag2a wcag2aa wcag21a wcag21aa wcag22a wcag22aa].freeze
  AXE_OPTIONS = {
    runOnly: { type: "tag", values: WCAG_TAGS },
    resultTypes: ["violations"]
  }.freeze

  def expect_no_accessibility_violations
    results = run_axe
    error = results["error"]
    raise "axe.run failed: #{error.fetch('message', error)}" if error

    violations = results.fetch("violations")
    return if violations.empty?

    raise RSpec::Expectations::ExpectationNotMetError, axe_failure_message(violations)
  end

  private

  def run_axe
    page.execute_script(axe_source)
    page.evaluate_async_script(<<~JS, AXE_OPTIONS)
      const options = arguments[0]
      const done = arguments[arguments.length - 1]

      window.axe.run(document, options)
        .then((results) => done({ violations: results.violations }))
        .catch((error) => done({ error: { name: error.name, message: error.message } }))
    JS
  end

  def axe_source
    @axe_source ||= File.read(AXE_SOURCE_PATH)
  rescue Errno::ENOENT
    raise "axe-core is not installed; run `pnpm install --frozen-lockfile`"
  end

  def axe_failure_message(violations)
    header = "axe detected #{violations.length} accessibility violation(s):"
    details = violations.flat_map { |violation| axe_violation_lines(violation) }
    [header, *details].join("\n")
  end

  def axe_violation_lines(violation)
    summary = "#{violation.fetch('id')} (#{violation['impact'] || 'unknown'}): #{violation.fetch('help')}"
    node_lines = violation.fetch("nodes").flat_map { |node| axe_node_lines(node) }
    ["", summary, violation.fetch("helpUrl"), *node_lines]
  end

  def axe_node_lines(node)
    lines = ["  target: #{node.fetch('target').inspect}", "  html: #{node.fetch('html')}"]
    lines << "  #{node['failureSummary']}" if node["failureSummary"]
    lines
  end
end

RSpec.configure do |config|
  config.include AccessibilityHelpers, type: :system
end
