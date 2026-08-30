# frozen_string_literal: true

module Shadcn
  class SliderPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Slider.new(min: 0, max: 100, value: 40, aria: { label: "音量" }))
    end

    def vertical
      render(
        Shadcn::Slider.new(
          min: 0,
          max: 100,
          value: 40,
          orientation: :vertical,
          style: "height: 160px",
          aria: { label: "音量" }
        )
      )
    end
  end
end
