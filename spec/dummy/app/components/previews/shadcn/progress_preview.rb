# frozen_string_literal: true

module Shadcn
  class ProgressPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Progress.new(value: 60, aria: { label: "アップロード進捗" }))
    end
  end
end
