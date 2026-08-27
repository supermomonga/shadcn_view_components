# typed: strict
# frozen_string_literal: true

require "rails"

module ShadcnViewComponents
  class Engine < ::Rails::Engine
    isolate_namespace ShadcnViewComponents

    initializer "shadcn_view_components.assets" do |app|
      root = ShadcnViewComponents::Engine.root
      app.config.assets.paths << root.join("app/assets/stylesheets")
      app.config.assets.paths << root.join("app/assets/javascripts")
      app.config.assets.precompile += %w[shadcn/shadcn.css]
    end

    # importmap-rails が導入済みの場合、コントローラとエントリを自動pinする。
    # 自動pinに失敗する環境向けの手動pin行は README にフォールバックとして記載する。
    # NOTE: importmap-rails は Rails::Application に importmap アクセサを生やすため、
    # 導入判定は app.respond_to?(:importmap) で行う(config.importmap は respond_to? が偽になる)
    initializer "shadcn_view_components.importmap", after: "importmap" do |app|
      next unless app.respond_to?(:importmap)

      app.importmap.pin_all_from(
        root.join("app/assets/javascripts/shadcn"),
        under: "shadcn"
      )
      # `import { register } from "shadcn"` が解決できるようにエントリも素の "shadcn" でpinする
      app.importmap.pin "shadcn", to: "shadcn/index.js"
    end
  end
end
