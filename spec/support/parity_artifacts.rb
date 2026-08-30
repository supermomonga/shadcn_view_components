# frozen_string_literal: true

# visual parityの実行成果物を置く場所を一元管理する。
# 通常テストは追跡中baselineへ一切書き込まず、明示的な更新時だけ切り替える。
module ParityArtifacts
  REPOSITORY_ROOT = File.expand_path("../..", __dir__)
  TRACKED_ROOT = File.join(REPOSITORY_ROOT, "spec/visual/baselines")
  TEMPORARY_ROOT = File.join(REPOSITORY_ROOT, "tmp/visual-parity")

  module_function

  def update_baselines?(env = ENV)
    env.fetch("PARITY_UPDATE_BASELINES", "0") == "1"
  end

  def output_root(env: ENV, pid: Process.pid)
    return TRACKED_ROOT if update_baselines?(env)

    configured = env["PARITY_ARTIFACTS_DIR"]
    return File.expand_path(configured, REPOSITORY_ROOT) if configured && !configured.empty?

    File.join(TEMPORARY_ROOT, "run-#{pid}")
  end

  def scenario_dir(demo_id, mode, **options)
    File.join(output_root(**options), demo_id.tr("/", "-"), mode.to_s)
  end
end
