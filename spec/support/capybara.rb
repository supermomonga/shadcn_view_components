# frozen_string_literal: true

# Cuprite(ヘッドレスChrome + Ferrum)によるシステムスペック構成(07-testing §1 層3)
require "capybara/rails"
require "capybara/cuprite"

Capybara.register_driver :shadcn_cuprite do |app|
  Capybara::Cuprite::Driver.new(
    app,
    window_size: [1280, 800],
    browser_options: { "no-sandbox" => nil },
    timeout: 30,
    process_timeout: 30
  )
end

Capybara.default_driver = :shadcn_cuprite
Capybara.javascript_driver = :shadcn_cuprite
Capybara.server = :puma, { Silent: true }
Capybara.default_max_wait_time = 5
