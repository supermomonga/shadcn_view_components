# frozen_string_literal: true

# gemのマウント用ダミーRailsアプリ(07-testing §2)。
# エンジン・ViewComponent・Propshaft・importmap-rails・Lookbook を載せた最小構成。
require "rails"
require "action_controller/railtie"
require "action_view/railtie"

# テーマCSS/コントローラJSの配信(システムスペックでJSを検証する)
require "propshaft"
require "importmap-rails"

require "view_component"
require "lookbook"
require "shadcn_view_components"

module Dummy
  class Application < Rails::Application
    config.load_defaults 8.1

    config.secret_key_base = "dummy-secret-key-base-for-tests-only"
    config.eager_load = false

    # システムスペックでアセット(JS)を配信する
    config.public_file_server.enabled = true

    # システムスペック(Capybara/Puma)からのリクエストを Host Authorization で弾かない
    config.hosts.clear

    # システムスペックはGETフォームで完結させる(CSRFの扱いをdummyから排除)
    config.action_controller.default_protect_from_forgery = false

    # importmap-rails: dummyのJSとvendored stimulus
    config.assets.paths << root.join("app/javascript")
    config.assets.paths << root.join("vendor/javascript")

    # ViewComponentプレビュー(Lookbookが参照する)。ViewComponent 4 では
    # 設定実体は ViewComponent::Config.current。Lookbookが起動時に
    # プレビューツリーを構築するため、クラス定義時点で登録しておく
    ViewComponent::Config.current.previews.paths << File.expand_path("../app/components/previews", __dir__)
  end
end
