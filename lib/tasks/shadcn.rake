# frozen_string_literal: true

# shadcn:* タスク群(02-upstream-sync §5)。
# すべてのタスクの実体は tools/extractor のCLI呼び出しであり、RakeはRuby側のI/Fを提供する。

namespace :shadcn do
  define_method(:run_extractor) do |task|
    repo_root = File.expand_path("../..", __dir__)
    sh "pnpm -C #{File.join(repo_root, 'tools', 'extractor')} exec tsx src/cli.ts #{task}" do |ok, _result|
      abort "extractor #{task} failed" unless ok
    end
  end

  desc "upstreamの最新レジストリを取得し vendor/shadcn/ を更新する"
  task :sync do
    run_extractor("fetch")
  end

  desc "vendor スナップショットから契約JSONを生成する(gen/contracts/)"
  task :extract do
    run_extractor("extract")
  end

  desc "契約JSONからRuby(lib/.../generated)とCSS(app/assets/stylesheets/shadcn)を生成する(extractを含む)"
  task :generate do
    run_extractor("generate")
  end

  desc "sync + generate の一括実行(= 追従作業のフルセット)"
  task update: :sync do
    run_extractor("generate")
  end

  desc "決定論性の検証。generate を一時ディレクトリに対して実行し、コミット済み生成物とバイト単位で比較する"
  task :check do
    run_extractor("check")
  end
end
