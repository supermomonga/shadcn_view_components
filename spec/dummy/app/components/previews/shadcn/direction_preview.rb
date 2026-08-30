# frozen_string_literal: true

module Shadcn
  class DirectionPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::DirectionProvider.new(dir: :rtl)) { "右から左へ読む文章" }
    end
  end
end
