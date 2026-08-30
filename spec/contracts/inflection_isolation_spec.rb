# frozen_string_literal: true

require "rails_helper"
require "open3"

RSpec.describe "OTP inflection isolation", type: :conformance do
  it "does not change host inflections when the gem is required without booting Rails" do
    script = <<~RUBY
      require "active_support/inflector"

      samples = ["input_otp", "otp_report", "InputOTP"]
      snapshot = lambda do
        samples.to_h do |value|
          [value, [
            ActiveSupport::Inflector.camelize(value),
            ActiveSupport::Inflector.underscore(value),
            ActiveSupport::Inflector.tableize(value)
          ]]
        end
      end
      before_require = snapshot.call

      require File.expand_path("lib/shadcn_view_components", Dir.pwd)
      raise "require changed ActiveSupport inflections" unless before_require == snapshot.call
    RUBY

    expect_isolated_script_success(script)
  end

  it "limits InputOTP mapping to the engine file and eager loads it" do
    script = <<~RUBY
      require "active_support/inflector"

      before_boot = {
        camelize: ActiveSupport::Inflector.camelize("input_otp"),
        underscore: ActiveSupport::Inflector.underscore("InputOTP"),
        tableize: ActiveSupport::Inflector.tableize("InputOTP")
      }

      require File.expand_path("spec/dummy/config/environment", Dir.pwd)
      after_boot = {
        camelize: ActiveSupport::Inflector.camelize("input_otp"),
        underscore: ActiveSupport::Inflector.underscore("InputOTP"),
        tableize: ActiveSupport::Inflector.tableize("InputOTP")
      }
      raise "boot changed ActiveSupport inflections" unless before_boot == after_boot

      inflector = Rails.autoloaders.main.inflector
      engine_file = File.expand_path("app/components/shadcn/input_otp.rb", Dir.pwd)
      host_file = Rails.root.join("app/components/input_otp.rb").to_s
      raise "engine path does not resolve InputOTP" unless inflector.camelize("input_otp", engine_file) == "InputOTP"
      raise "host path inherited engine override" unless inflector.camelize("input_otp", host_file) == "InputOtp"

      Rails.application.eager_load!
      raise "InputOTP was not eager loaded" unless Shadcn::InputOTP.name == "Shadcn::InputOTP"
      unless ShadcnViewComponents::Classes.contract_for(:input_otp) == ShadcnViewComponents::Contracts::InputOTP
        raise "InputOTP contract was not resolved"
      end
      unless ShadcnViewComponents::Classes.contract_for(:"input_otp/group") == ShadcnViewComponents::Contracts::InputOTP::Group
        raise "nested InputOTP contract was not resolved"
      end
    RUBY

    expect_isolated_script_success(script)
  end

  define_method(:expect_isolated_script_success) do |script|
    stdout, stderr, status = Open3.capture3("bundle", "exec", "ruby", "-e", script, chdir: REPO_ROOT)

    expect(status).to be_success, "isolated process failed:\n#{stdout}\n#{stderr}"
  end
end
