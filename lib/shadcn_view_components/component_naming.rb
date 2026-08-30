# typed: strict
# frozen_string_literal: true

module ShadcnViewComponents
  # file/contract名から、このgemが定義するcomponent定数名を決める。
  # ActiveSupportのglobal inflectionには依存せず、頭字語の規則もここだけで管理する。
  module ComponentNaming
    extend T::Sig

    CONSTANT_OVERRIDES = T.let({
      "input_otp" => "InputOTP"
    }.freeze, T::Hash[String, String])

    sig { params(basename: String).returns(String) }
    def self.constant_name(basename)
      CONSTANT_OVERRIDES.fetch(basename) do
        basename.split("_").map(&:capitalize).join
      end
    end
  end
end
