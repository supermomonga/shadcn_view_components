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
      app.config.assets.paths << root.join("app/assets/javascripts")
    end

    # importmap-railsの標準engine統合に従い、map定義とcache監視対象を
    # importmap本体のinitializerより前に追加する。未導入のhostでは何もしない。
    initializer "shadcn_view_components.importmap", before: "importmap" do |app|
      next unless app.config.respond_to?(:importmap)

      app.config.importmap.paths << root.join("config/importmap.rb")
      app.config.importmap.cache_sweepers << root.join("app/assets/javascripts")
    end
  end
end
