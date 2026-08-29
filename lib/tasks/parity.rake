# frozen_string_literal: true

# 見た目の upstream パリティ検証(spec/visual)の入口。
#
#   bundle exec rake parity:run      ... ハーネスを明示的に再ビルドしてから比較
#   PARITY_RATIO=0.01 rake parity:run ... 閾値を1%に緩めて実行
#
# upstream参照サーバ(vite preview)の起動・停止とビルドのキャッシュ判断は
# spec/support/parity_server.rb(スペック本体側)が担うため、rakeタスクは薄い。
# 素の bundle exec rspec でもパリティは実行される(このタスクは強制再ビルドが付く)。
require_relative "../../spec/support/parity_server"

namespace :parity do
  desc "upstream(React/Vite)とdummy(Lookbook)の描画をピクセル比較する(ハーネスを明示的に再ビルド)"
  task :run do
    ParityServer.rebuild!
    sh "bundle exec rspec spec/visual"
  end
end
