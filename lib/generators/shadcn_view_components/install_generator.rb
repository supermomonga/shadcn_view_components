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
    # - ホストのTailwindエントリCSSに @import 行と @source 行を追記する
    #   (Tailwind v4の自動コンテンツ検出はgem内部を走査しないため、@sourceの明示指定が必須)
    # - JS登録スニペットの追記を案内する
    # - 冪等であること(二回実行で重複行を作らない。gemパスが変わった場合は最新化する)
    class InstallGenerator < Rails::Generators::Base
      extend T::Sig
      include Thor::Actions

      source_root File.expand_path("templates", __dir__)

      class_option :stylesheet, type: :string, default: "app/assets/stylesheets/application.css",
                                desc: "Host Tailwind entry CSS to append imports to"
      class_option :javascript, type: :string, default: "importmap",
                                desc: "JavaScript delivery mode: importmap or bundler"

      VENDORED_JAVASCRIPT_PATH = "vendor/shadcn_view_components/javascript"

      sig { void }
      def append_stylesheets
        JavascriptDeliveryMode.validate(T.cast(options["javascript"], String))
        entry = T.cast(options["stylesheet"], String)
        entry_path = File.expand_path(entry, destination_root)
        current = File.exist?(entry_path) ? File.binread(entry_path) : ""
        normalized = stylesheet_with_directives(current)

        create_file(entry, normalized, force: true) unless current == normalized
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
          managed_comment_line?(line) || import_directive_line?(line) || source_directive_line?(line)
        end
        insertion_index = directive_insertion_index(lines)
        lines.insert(insertion_index, managed_comment, import_directive, source_directive)

        "#{lines.join(newline)}#{newline}"
      end

      sig { returns(String) }
      def managed_comment
        "/* shadcn_view_components */"
      end

      sig { returns(String) }
      def import_directive
        '@import "shadcn/shadcn.css";'
      end

      sig { returns(String) }
      def source_directive
        "@source \"#{components_source_path}\";"
      end

      sig { params(line: String).returns(T::Boolean) }
      def managed_comment_line?(line)
        line.strip == managed_comment
      end

      sig { params(line: String).returns(T::Boolean) }
      def import_directive_line?(line)
        line.match?(%r{\A[ \t]*@import[ \t]+(["'])shadcn/shadcn\.css\1[ \t]*;?[ \t]*\z})
      end

      sig { params(line: String).returns(T::Boolean) }
      def source_directive_line?(line)
        line.match?(%r{\A[ \t]*@source[ \t]+(["'])[^"'\r\n]*/shadcn_view_components[^/"'\r\n]*/app/components\1[ \t]*;?[ \t]*\z})
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
      def components_source_path
        File.join(gem_root, "app", "components")
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
