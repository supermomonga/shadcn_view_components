# frozen_string_literal: true

module Shadcn
  class AlertPreview < ViewComponent::Preview
    def default
      render(Shadcn::Alert.new) do
        safe_join([render(Shadcn::Alert::Title.new) { "注意" }, render(Shadcn::Alert::Description.new) { "説明テキスト" }])
      end
    end

    def destructive
      render(Shadcn::Alert.new(variant: :destructive)) do
        safe_join([render(Shadcn::Alert::Title.new) { "エラー" }, render(Shadcn::Alert::Description.new) { "破壊的な内容" }])
      end
    end
  end
end
