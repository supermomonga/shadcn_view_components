# frozen_string_literal: true

# Lookbookプレビュー(07-testing §7)。upstreamのdocsページに相当する全バリアントの一覧。
# 手動ビジュアル確認の場でありテストではない。
module Shadcn
  class ButtonPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Button.new) { "Button" }
    end

    def variants
      render(Shadcn::Button.new(variant: :secondary)) { "Secondary" }
    end

    def destructive
      render(Shadcn::Button.new(variant: :destructive)) { "Destructive" }
    end

    def outline
      render(Shadcn::Button.new(variant: :outline)) { "Outline" }
    end

    def ghost
      render(Shadcn::Button.new(variant: :ghost)) { "Ghost" }
    end

    def link
      render(Shadcn::Button.new(variant: :link)) { "Link" }
    end

    def sizes
      render(Shadcn::Button.new(size: :sm)) { "Small" }
    end

    def with_icon
      render(Shadcn::Button.new(size: :icon)) { "☑" }
    end

    def as_link
      render(Shadcn::Button.new(tag: :a, href: "#")) { "Link Button" }
    end
  end
end
