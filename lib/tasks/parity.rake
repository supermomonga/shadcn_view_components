# frozen_string_literal: true

# 見た目の upstream パリティ検証(spec/visual/parity_spec.rb)のオーケストレーション。
#
#   bundle exec rake parity:run      ... ビルド+upstreamサーバ起動+比較
#   PARITY_RATIO=0.01 rake parity:run ... 閾値を1%に緩めて実行
#
# 差分の成果物(ours/upstream/diff/report)は spec/visual/baselines/ に置かれる。
namespace :parity do
  desc "upstream(React/Vite)とdummy(Lookbook)の描画をピクセル比較する"
  task :run do
    Dir.chdir(File.expand_path("../..", __dir__)) do
      sh "pnpm -C tools/visual-parity run build"

      vite = spawn("pnpm", "-C", "tools/visual-parity", "run", "serve")
      begin
        ready = false
        60.times do
          ready = system("curl -s -o /dev/null http://127.0.0.1:4173/")

          break if ready

          sleep 0.5
        end
        abort "vite preview (4173) が起動しません" unless ready

        sh({ "PARITY" => "1" }, "bundle exec rspec spec/visual/parity_spec.rb")
      ensure
        if vite
          Process.kill("TERM", vite)
          begin
            Process.wait(vite)
          rescue SystemCallError
            nil
          end
        end
      end
    end
  end
end
