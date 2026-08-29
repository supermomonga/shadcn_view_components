# frozen_string_literal: true

ENV["RAILS_ENV"] ||= "test"

require_relative "spec_helper"
require_relative "dummy/config/environment"

require "rspec/rails"
require "view_component/test_helpers"

Dir[File.expand_path("support/**/*.rb", __dir__)].each { |path| require path }

# リポジトリルート(spec/ の一つ上)。vendor や gen への参照に使う
REPO_ROOT = File.expand_path("..", __dir__)

# ViewComponent 4 の TestHelpers は rendered_root_element を提供しないため
# 薄いラッパを用意する。context: "template" は thead/tr 等、単独では有効でない
# コンテンツモデルの要素もそのまま解析するための指定
module RenderedRoot
  def rendered_fragment
    Nokogiri::HTML5.fragment(rendered_content, context: "template")
  end

  def rendered_root_element
    rendered_fragment.at_xpath("./*[1]")
  end
end

RSpec.configure do |config|
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!
  config.fixture_paths = []

  config.include ViewComponent::TestHelpers, type: :component
  config.include ViewComponent::TestHelpers, type: :conformance
  config.include RenderedRoot, type: :component
  config.include RenderedRoot, type: :conformance

  # 見た目のupstreamパリティ検証(spec/visual)は常時実行する。upstream参照サーバ
  # (vite preview)のビルドと起動は ParityServer(spec/support/parity_server.rb)が
  # 行うため、素の bundle exec rspec でそのまま走る。外したいときだけ PARITY=0
  config.filter_run_excluding parity: true if ENV["PARITY"] == "0"

  config.before(:context, :parity) { ParityServer.ensure_running! }

  config.before do |example|
    driven_by :shadcn_cuprite if example.metadata[:type] == :system
  end
end
