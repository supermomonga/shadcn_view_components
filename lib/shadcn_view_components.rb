# typed: strict
# frozen_string_literal: true

# 生成物(contracts/*.rb)の T.let / sig がロード時に評価されるため、
# view_component と sorbet-runtime を最初に明示ロードする
require "sorbet-runtime"
require "tailwindcss-rails"
require "view_component"

require_relative "shadcn_view_components/version"
require_relative "shadcn_view_components/component_naming"
require_relative "shadcn_view_components/property_contracts"
require_relative "shadcn_view_components/engine"
require_relative "shadcn_view_components/classes"

# 生成された契約モジュール(lib/shadcn_view_components/generated/contracts/*.rb)。
# app/components の実装はこの定数のみを参照する(クラス文字列を手書きしない規約)。
Dir[File.expand_path("shadcn_view_components/generated/contracts/*.rb", __dir__)].each { |path| require path }

# 個別契約(静的抽出の対象外コンポーネント — calendar)
require_relative "shadcn_view_components/contracts/calendar"
