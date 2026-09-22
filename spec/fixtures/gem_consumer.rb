# frozen_string_literal: true

# Copied into a temporary consumer by tailwind_engine_distribution_spec.rb.
# Only normal gem loading is allowed here; no checkout or dummy app helpers.
require "json"
require "logger"
require "rake"
require "rails"
require "action_controller/railtie"
require "action_view/railtie"
require "propshaft"
require "importmap-rails" if ENV.fetch("JAVASCRIPT_MODE") == "importmap"
require "shadcn_view_components"

class ConsumerApplication < Rails::Application
  config.root = Pathname(ENV.fetch("CONSUMER_ROOT"))
  config.eager_load = false
  config.secret_key_base = "packaged-gem-consumer"
  config.logger = Logger.new(nil)
end

ConsumerApplication.initialize!
ConsumerApplication.load_generators
arguments = ENV.fetch("JAVASCRIPT_MODE") == "bundler" ? ["--javascript", "bundler"] : []
Rails::Generators.invoke("shadcn_view_components:install", arguments, destination_root: Rails.root)
generated_css = Rails.root.join("app/assets/tailwind/application.css").binread
Rails::Generators.invoke("shadcn_view_components:install", arguments, destination_root: Rails.root)

ConsumerApplication.load_tasks
Rake::Task["tailwindcss:build"].invoke

assets = %w[shadcn/index.js shadcn/controllers/calendar_controller.js shadcn/shadcn.css].to_h do |name|
  asset = Rails.application.assets.load_path.find(name)
  [name, { "path" => asset.path.realpath.to_s, "url" => Rails.application.assets.resolver.resolve(name) }]
end
imports = JSON.parse(Rails.application.importmap.to_json(resolver: ActionController::Base.helpers)).fetch("imports") if Rails.application.config.respond_to?(:importmap)

view_context = ActionController::Base.new.view_context
button = Shadcn::Button.new(variant: :outline).render_in(view_context) { "Packaged button" }
calendar = Shadcn::Calendar.new(month: Date.new(2026, 8, 1), selected: Date.new(2026, 8, 27)).render_in(view_context)
sources = [
  $LOADED_FEATURES.find { |path| path.end_with?("/lib/shadcn_view_components.rb") },
  Shadcn.const_source_location(:Button).first,
  Shadcn.const_source_location(:Calendar).first,
  ShadcnViewComponents::Contracts.const_source_location(:Button).first,
  ShadcnViewComponents::Contracts.const_source_location(:Calendar).first,
  ShadcnViewComponents::Generators.const_source_location(:InstallGenerator).first,
  Shadcn::Button.instance_method(:call).source_location.first
]
puts JSON.generate(
  "engine_root" => ShadcnViewComponents::Engine.root.realpath.to_s,
  "gem_root" => File.realpath(Gem.loaded_specs.fetch("shadcn_view_components").full_gem_path),
  "sources" => sources.map { |path| File.realpath(path) },
  # Built-in extensions such as enumerator.so have no filesystem path.
  "checkout_features" => $LOADED_FEATURES.grep(%r{\A/}).select { |path| File.realpath(path).start_with?("#{ENV.fetch('CHECKOUT_ROOT')}/") },
  "versions" => Gem.loaded_specs.transform_values { |spec| spec.version.to_s },
  "generated_css" => generated_css,
  "assets" => assets,
  "imports" => imports,
  "button" => button,
  "calendar" => calendar
)
