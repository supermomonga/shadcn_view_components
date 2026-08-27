# typed: strict
# frozen_string_literal: true

# 本リポジトリ用の手書きRBI。
# - Rails::Engine の root / isolate_namespace は inherited フックで動的定義されるため
#   tapiocaのRBIに現れない(Engine.root)
# - Rails::Generators は railties から自動requireされず、tapiocaのRBIに現れない。
#   DSL(Thor由由来)のうち本gemが使う面だけを宣言する

module Rails
  module Generators
    class Base
      sig { returns(T.untyped) }
      def options; end

      sig { returns(String) }
      def destination_root; end

      sig { params(message: T.untyped).void }
      def say(message); end

      sig { params(path: T.untyped, contents: T.untyped, config: T.untyped).returns(T.untyped) }
      def create_file(path, contents = T.unsafe(nil), config = T.unsafe(nil)); end

      sig { params(path: T.untyped, contents: T.untyped, config: T.untyped).returns(T.untyped) }
      def append_to_file(path, contents = T.unsafe(nil), config = T.unsafe(nil)); end

      sig { params(path: T.untyped, regexp: T.untyped, replacement: T.untyped, config: T.untyped).returns(T.untyped) }
      def gsub_file(path, regexp, replacement, config = T.unsafe(nil)); end
    end
  end
end

module ShadcnViewComponents
  class Engine < ::Rails::Engine
    sig { returns(Pathname) }
    def self.root; end
  end

  module Generators
    class InstallGenerator < Rails::Generators::Base
      sig { params(name: Symbol, type: T.untyped, default: T.untyped, desc: T.untyped).void }
      def self.class_option(name, type: T.unsafe(nil), default: T.unsafe(nil), desc: T.unsafe(nil)); end

      sig { params(path: T.untyped).returns(T.untyped) }
      def self.source_root(path = T.unsafe(nil)); end
    end
  end
end
