# frozen_string_literal: true

module Shadcn
  class CarouselPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Carousel.new(class: "max-w-xs")) do
        safe_join([
          render(Shadcn::Carousel::Content.new) do
            safe_join([
              carousel_item("スライド1"),
              carousel_item("スライド2"),
              carousel_item("スライド3"),
              carousel_item("スライド4")
            ])
          end,
          render(Shadcn::Carousel::Previous.new),
          render(Shadcn::Carousel::Next.new)
        ])
      end
    end

    private

    def carousel_item(text)
      render(Shadcn::Carousel::Item.new) do
        content_tag(:div, class: "flex size-40 items-center justify-center rounded-md border") { text }
      end
    end
  end
end
