# frozen_string_literal: true

module Shadcn
  class SonnerPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Sonner::Toaster.new(aria: { label: "通知" }))
    end
  end
end
