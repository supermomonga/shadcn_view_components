# frozen_string_literal: true

module Shadcn
  class CarouselPreview < Shadcn::PreviewBase
    def default
      carousel
    end

    def vertical
      carousel(orientation: :vertical)
    end

    def rtl
      carousel(direction: :rtl)
    end

    private

    def carousel(orientation: :horizontal, direction: :ltr)
      render(Shadcn::Carousel.new(class: "max-w-xs", orientation:, direction:,
                                  aria: { label: "サンプルスライド" })) do
        safe_join([
                    render(Shadcn::Carousel::Content.new(class: orientation == :vertical ? "h-[200px]" : nil)) do
                      safe_join((1..4).map { |number| carousel_item(number) })
                    end,
                    render(Shadcn::Carousel::Previous.new),
                    render(Shadcn::Carousel::Next.new)
                  ])
      end
    end

    def carousel_item(number)
      render(Shadcn::Carousel::Item.new(aria: { label: "#{number} of 4" })) do
        text = "スライド#{number}"
        content_tag(:div, class: "flex size-40 items-center justify-center rounded-md border") { text }
      end
    end
  end
end
