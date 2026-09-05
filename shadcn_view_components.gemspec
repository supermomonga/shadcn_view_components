# frozen_string_literal: true

require_relative "lib/shadcn_view_components/version"

Gem::Specification.new do |spec|
  spec.name = "shadcn_view_components"
  spec.version = ShadcnViewComponents::VERSION
  spec.authors = ["supermomonga"]
  spec.email = ["kamoto@supermomonga.com"]

  spec.summary = "shadcn/ui components as Rails ViewComponents with a deterministic sync pipeline"
  spec.description = "Ports shadcn/ui (base-nova) to Rails ViewComponent + Stimulus. " \
                     "Class contracts are extracted from the upstream registry and generated " \
                     "deterministically, so upstream drift is detected automatically."
  spec.homepage = "https://github.com/supermomonga/shadcn_view_components"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 4.0.0"
  spec.metadata = {
    "homepage_uri" => spec.homepage,
    "source_code_uri" => spec.homepage,
    "changelog_uri" => "#{spec.homepage}/blob/main/CHANGELOG.md",
    "rubygems_mfa_required" => "true"
  }

  spec.files = Dir[
    "lib/shadcn_view_components.rb",
    "lib/shadcn_view_components/**/*",
    "lib/generators/**/*",
    "config/importmap.rb",
    "app/components/**/*",
    "app/assets/javascripts/**/*",
    "app/assets/stylesheets/**/*",
    "app/assets/tailwind/**/*"
  ]
  spec.bindir = "exe"
  spec.executables = []
  spec.require_paths = ["lib"]

  # 許容範囲はsupport matrix(docs/reference/support-matrix.md)と一致させる。
  # major updateは未検証のため上限で抑え、検証済みになったときだけ緩める。
  spec.add_dependency "rails", "~> 8.1"
  spec.add_dependency "tailwindcss-rails", "~> 4.3"
  spec.add_dependency "tailwind_merge", "~> 1.5"
  # view_component 4.0系はactivesupport < 8.1でありRails 8.1と組み合わせ不能なため、
  # Rails 8.1で解決可能な実際の下限は4.1.0になる。
  spec.add_dependency "view_component", "~> 4.1"
  # 生成物(contracts/*.rb)の T.let / sig が実行時に評価されるため runtime も必要
  spec.add_dependency "sorbet-runtime", "~> 0.6"

  spec.add_development_dependency "cuprite"
  spec.add_development_dependency "importmap-rails", ">= 2.0"
  spec.add_development_dependency "lookbook", ">= 2.0"
  spec.add_development_dependency "propshaft"
  spec.add_development_dependency "rspec-rails"
  spec.add_development_dependency "rubocop"
  spec.add_development_dependency "rubocop-packaging"
  spec.add_development_dependency "rubocop-sorbet"
  spec.add_development_dependency "sorbet-static", "~> 0.5"
  spec.add_development_dependency "tapioca"
  spec.add_development_dependency "turbo-rails"
end
