# frozen_string_literal: true

require "json"

module UpstreamSyncReport
  module_function

  OUTCOMES = {
    "success" => "✅ 成功",
    "failure" => "❌ 失敗",
    "cancelled" => "⛔ 中断",
    "skipped" => "⚪ 未実行"
  }.freeze

  def render(manifest:, verification_outcome:, run_url:, changes:, contracts:)
    outcome = OUTCOMES.fetch(verification_outcome) { "❌ 不明 (#{verification_outcome})" }

    <<~MARKDOWN
      ## upstream sync

      #{revision_lines(manifest)}
      - 必須検証: #{outcome} (`bundle exec rake verify`)
      - 検証実行: [upstream-drift workflow](#{run_url})

      このPRは最初にdraftで作成し、headを指定して通常の `CI` workflowを明示的に起動します。
      8個のstatus checkが実際に作成されたことを確認した後だけ、review readyへ変更します。
      `github.token` で作成したPRの `pull_request` eventが抑止されるかどうかには依存しません。

      ### 変更サマリ

      ```text
      #{summary_or_none(changes)}
      ```

      ### 契約差分 (レビューの主対象)

      ```text
      #{summary_or_none(contracts)}
      ```

      ### レビュー手順

      1. `gen/contracts/` のdiffを確認する (クラス、slot、variantの増減)
      2. PRに付いた8個の `CI` status checkを確認する
      3. itemの削除がある場合は、対応componentのdeprecationを判断する
    MARKDOWN
  end

  def revision_lines(manifest)
    source = manifest.fetch("source")
    release = source.fetch("upstream_release")
    snapshot = source.fetch("registry_snapshot")

    [
      "- upstream tag: `#{release.fetch('tag')}`",
      "- release commit: `#{release.fetch('resolved_sha')}`",
      "- registry snapshot: `#{snapshot.fetch('content_sha256')}`",
      "- fetched at: `#{manifest.fetch('fetched_at')}`"
    ].join("\n")
  end

  def summary_or_none(value)
    stripped = value.to_s.strip
    stripped.empty? ? "(差分なし)" : stripped
  end
end

if $PROGRAM_NAME == __FILE__
  manifest = JSON.parse(File.read(ENV.fetch("MANIFEST_PATH", "vendor/shadcn/manifest.json")))
  changes = File.read(ENV.fetch("CHANGES_FILE"))
  contracts = File.read(ENV.fetch("CONTRACTS_FILE"))

  puts UpstreamSyncReport.render(
    manifest: manifest,
    verification_outcome: ENV.fetch("VERIFICATION_OUTCOME"),
    run_url: ENV.fetch("RUN_URL"),
    changes: changes,
    contracts: contracts
  )
end
