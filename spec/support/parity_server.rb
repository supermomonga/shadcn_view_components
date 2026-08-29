# frozen_string_literal: true

require "digest/sha2"
require "net/http"

# visual parityスペック(spec/visual)が前提とするupstream参照サーバ
# (vite preview: 127.0.0.1:4173)の自己起動。素の bundle exec rspec でも
# パリティが必ず走るようにするための仕組みで、rake parity:run はこの上の
# 「明示的な再ビルド付き」入口として薄く残す(lib/tasks/parity.rake)。
module ParityServer
  HARNESS_DIR = File.expand_path("../../tools/visual-parity", __dir__)
  URL = "http://127.0.0.1:4173/"
  BOOT_TIMEOUT = 30

  # ビルド入力のフィンガープリント対象。manifest は各registry itemのsha256を
  # 内包するため vendor の更新もこれで検出される。shadcn.css はテーマトークン
  # (theme.css から @import される)なのでビルド入力に含まれる
  BUILD_INPUTS = [
    File.expand_path("../../vendor/shadcn/manifest.json", __dir__),
    File.expand_path("../../app/assets/stylesheets/shadcn/shadcn.css", __dir__),
    *%w[package.json pnpm-lock.yaml vite.config.ts index.html unpack.mjs].map { |f| File.join(HARNESS_DIR, f) },
    *%w[main.tsx theme.css demos.tsx demos-a-to-m.tsx demos-n-to-z.tsx].map { |f| File.join(HARNESS_DIR, "src", f) },
    File.join(HARNESS_DIR, "src/lib/utils.ts")
  ].freeze

  module_function

  # ビルドが要れば済ませ、サーバが上がっていなければ起動する。
  # rails_helper の before(:context, :parity) から呼ばれる
  def ensure_running!
    rebuild! if stale?
    boot! unless responding?
  end

  # 既に何かが4173で応答していればそれを再利用する(2本目のrspecや手動起動のvite)
  def responding?
    Net::HTTP.get_response(URI(URL)).is_a?(Net::HTTPSuccess)
  rescue SystemCallError, SocketError
    false
  end

  # distが無い、または前回ビルド時からビルド入力が変わっている
  def stale?
    File.read(stamp_path) == fingerprint
  rescue Errno::ENOENT
    true
  end

  def rebuild!
    system("pnpm", "-C", HARNESS_DIR, "run", "build") ||
      abort("visual parityハーネスのビルドに失敗しました(pnpm -C tools/visual-parity run build)")
    File.write(stamp_path, fingerprint)
  end

  def boot!
    pid = Process.spawn("pnpm", "-C", HARNESS_DIR, "run", "serve")
    at_exit { stop!(pid) }
    deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + BOOT_TIMEOUT
    until responding?
      exited, status = Process.waitpid2(pid, Process::WNOHANG)
      abort "vite preview (4173) が起動しません(exitstatus: #{status.exitstatus})" if exited
      if Process.clock_gettime(Process::CLOCK_MONOTONIC) > deadline
        stop!(pid)
        abort "vite preview (4173) が#{BOOT_TIMEOUT}秒以内に応答しません"
      end
      sleep 0.5
    end
  end

  def stop!(pid)
    Process.kill("TERM", pid)
    Process.wait(pid)
  rescue SystemCallError
    nil
  end

  def stamp_path
    File.join(HARNESS_DIR, "dist", ".parity-build-stamp")
  end

  def fingerprint
    Digest::SHA256.hexdigest(BUILD_INPUTS.map { |path| File.binread(path) }.join("\0"))
  end
end
