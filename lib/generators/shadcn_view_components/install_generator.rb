# typed: strict
# frozen_string_literal: true

require "rails/generators"

module ShadcnViewComponents
  module Generators
    module JavascriptDeliveryMode
      extend T::Sig

      MODES = %w[importmap bundler].freeze

      sig { params(value: String).returns(String) }
      def self.validate(value)
        return value if MODES.include?(value)

        Kernel.raise ArgumentError, "unknown JavaScript delivery mode #{value.inspect} (valid: #{MODES.join(', ')})"
      end
    end

    # ホストアプリへのインストール手順を自動化する(06-theming-tailwind §5)。
    #
    # - tailwindcss-rails標準のTailwindエントリCSSにEngine CSSの @import 行を追記する
    # - JS登録スニペットの追記を案内する
    # - 冪等であること(二回実行で重複行を作らない)
    class InstallGenerator < Rails::Generators::Base
      extend T::Sig
      include Thor::Actions

      source_root File.expand_path("templates", __dir__)

      class_option :javascript, type: :string, default: "importmap",
                                desc: "JavaScript delivery mode: importmap or bundler"

      VENDORED_JAVASCRIPT_PATH = "vendor/shadcn_view_components/javascript"
      TAILWIND_STYLESHEET_PATH = "app/assets/tailwind/application.css"

      sig { void }
      def append_stylesheets
        JavascriptDeliveryMode.validate(T.cast(options["javascript"], String))
        entry_path = File.expand_path(TAILWIND_STYLESHEET_PATH, destination_root)
        unless File.file?(entry_path)
          Kernel.raise Thor::Error,
                       "#{TAILWIND_STYLESHEET_PATH} was not found. Run `bin/rails tailwindcss:install` first."
        end

        current = File.binread(entry_path)
        normalized = stylesheet_with_directives(current)

        create_file(TAILWIND_STYLESHEET_PATH, normalized, force: true) unless current == normalized
      end

      sig { void }
      def install_javascript_package
        return unless bundler_javascript?

        # このdirectoryはgenerator管理。gem更新時に削除済みfileを残さず完全同期する。
        if behavior == :revoke
          empty_directory(VENDORED_JAVASCRIPT_PATH)
        else
          remove_dir(VENDORED_JAVASCRIPT_PATH)
          directory(javascript_package_path, VENDORED_JAVASCRIPT_PATH, force: true)
        end
      end

      sig { void }
      def print_js_instructions
        if bundler_javascript?
          say <<~TEXT

            Interactive components need Stimulus registration. The ESM package was
            synchronized to #{VENDORED_JAVASCRIPT_PATH}. Add the repository-relative
            package with your package manager:

                pnpm add ./#{VENDORED_JAVASCRIPT_PATH}
                # or: npm install ./#{VENDORED_JAVASCRIPT_PATH}

            Then add to the bundled JavaScript entry point:

                import { register } from "@supermomonga/shadcn-view-components"
                register(application)
          TEXT
        else
          say <<~TEXT

            Interactive components need Stimulus registration. With importmap-rails
            (auto-pinned by the engine), add to app/javascript/application.js:

                import { register } from "@supermomonga/shadcn-view-components"
                register(application)
          TEXT
        end
      end

      private

      sig { params(contents: String).returns(String) }
      def stylesheet_with_directives(contents)
        newline = contents.include?("\r\n") ? "\r\n" : "\n"
        lines = contents.lines(chomp: true).reject do |line|
          managed_comment_line?(line) || animate_import_line?(line) || engine_import_line?(line)
        end
        insertion_index = directive_insertion_index(lines)
        while insertion_index.positive? && lines.fetch(insertion_index - 1).empty?
          lines.delete_at(insertion_index - 1)
          insertion_index -= 1
        end
        lines.insert(insertion_index, animate_import, "", managed_comment, engine_import)

        "#{lines.join(newline)}#{newline}"
      end

      sig { returns(String) }
      def managed_comment
        "/* shadcn_view_components */"
      end

      sig { returns(String) }
      def animate_import
        '@import "tw-animate-css";'
      end

      sig { returns(String) }
      def engine_import
        '@import "../builds/tailwind/shadcn_view_components";'
      end

      sig { params(line: String).returns(T::Boolean) }
      def managed_comment_line?(line)
        line.strip == managed_comment
      end

      sig { params(line: String).returns(T::Boolean) }
      def animate_import_line?(line)
        line.match?(/\A[ \t]*@import[ \t]+(["'])tw-animate-css\1[ \t]*;?[ \t]*\z/)
      end

      sig { params(line: String).returns(T::Boolean) }
      def engine_import_line?(line)
        line.match?(%r{\A[ \t]*@import[ \t]+(["'])\.\./builds/tailwind/shadcn_view_components\1[ \t]*;?[ \t]*\z})
      end

      sig { params(lines: T::Array[String]).returns(Integer) }
      def directive_insertion_index(lines)
        in_comment = T.let(false, T::Boolean)

        lines.each_with_index do |line, index|
          stripped = line.strip
          if in_comment
            in_comment = false if stripped.include?("*/")
          elsif stripped.start_with?("/*")
            in_comment = !stripped.include?("*/")
          elsif !stripped.empty? && !prologue_directive?(stripped)
            return index
          end
        end

        lines.length
      end

      sig { params(line: String).returns(T::Boolean) }
      def prologue_directive?(line)
        line.match?(/\A@charset[ \t]+/) || line.match?(/\A@import(?:[ \t]+|\()/)
      end

      sig { returns(String) }
      def gem_root
        Gem.loaded_specs.fetch("shadcn_view_components").full_gem_path
      end

      sig { returns(String) }
      def javascript_package_path
        File.join(gem_root, "app", "assets", "javascripts", "shadcn")
      end

      sig { returns(T::Boolean) }
      def bundler_javascript?
        JavascriptDeliveryMode.validate(T.cast(options["javascript"], String)) == "bundler"
      end
    end
  end
end
