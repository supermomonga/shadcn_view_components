# typed: strict
# frozen_string_literal: true

require "rails"

module ShadcnViewComponents
  class Engine < ::Rails::Engine
    isolate_namespace ShadcnViewComponents

    # Rails engineのcomponentはhost applicationとmain loaderを共有する。
    # fallbackはRails既定のinflectorへ委譲し、このengineのinput_otp.rbだけを
    # InputOTPへ写像することでhostの同名fileとActiveSupportの命名規則を変更しない。
    class ComponentInflector
      extend T::Sig

      sig { params(delegate: T.untyped, input_otp_path: String).void }
      def initialize(delegate:, input_otp_path:)
        @delegate = T.let(delegate, T.untyped)
        @input_otp_path = T.let(File.expand_path(input_otp_path), String)
      end

      sig { params(basename: String, abspath: String).returns(String) }
      def camelize(basename, abspath)
        return ShadcnViewComponents::ComponentNaming.constant_name(basename) if basename == "input_otp" && File.expand_path(abspath) == @input_otp_path

        T.cast(@delegate.camelize(basename, abspath), String)
      end

      sig { params(overrides: T::Hash[String, String]).void }
      def inflect(overrides)
        @delegate.inflect(overrides)
      end
    end
    private_constant :ComponentInflector

    initializer "shadcn_view_components.inflector", before: :setup_main_autoloader do
      loader = Rails.autoloaders.main
      input_otp_path = ShadcnViewComponents::Engine.root.join("app/components/shadcn/input_otp.rb").to_s
      loader.inflector = ComponentInflector.new(delegate: loader.inflector, input_otp_path: input_otp_path)
    end

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
