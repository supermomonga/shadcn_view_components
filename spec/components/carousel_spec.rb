# frozen_string_literal: true

require "rails_helper"

class CarouselComposition < ViewComponent::Base
  def initialize(root_args: {}, content_args: {}, item_args: {}, previous_args: {}, next_args: {})
    @root_args = root_args
    @content_args = content_args
    @item_args = item_args
    @previous_args = previous_args
    @next_args = next_args
    super()
  end

  def call
    render(Shadcn::Carousel.new(**@root_args)) do
      safe_join([
                  render(Shadcn::Carousel::Content.new(**@content_args)) do
                    render(Shadcn::Carousel::Item.new(**@item_args)) { "スライド" }
                  end,
                  render(Shadcn::Carousel::Previous.new(**@previous_args)),
                  render(Shadcn::Carousel::Next.new(**@next_args))
                ])
    end
  end
end

RSpec.describe Shadcn::Carousel, type: :component do
  it "renders normalized layout state, accessibility semantics, and composed root actions" do
    render_inline(CarouselComposition.new(
                    root_args: {
                      orientation: :vertical,
                      direction: :rtl,
                      class: "h-80",
                      aria: { label: "おすすめ" },
                      data: {
                        controller: "preview",
                        action: "click->preview#record",
                        orientation: "horizontal",
                        direction: "ltr"
                      }
                    },
                    item_args: { aria: { label: "1 of 1" } }
                  ))

    root = rendered_root_element
    expect(root["id"]).to match(/\Ashadcn-carousel-[0-9a-f]{24}\z/)
    expect(root.attributes.transform_values(&:value)).to include(
      "data-slot" => "carousel",
      "data-orientation" => "vertical",
      "data-direction" => "rtl",
      "dir" => "rtl",
      "tabindex" => "0",
      "role" => "region",
      "aria-roledescription" => "carousel",
      "aria-label" => "おすすめ",
      "data-shadcn-generated-root-id" => "true"
    )
    expect(root["data-controller"].split).to contain_exactly("shadcn--carousel", "preview")
    expect(root["data-action"].split).to contain_exactly(
      "keydown->shadcn--carousel#navigate",
      "click->preview#record"
    )
    expect(root["class"].split).to include("relative", "group/carousel", "h-80")

    item = root.at_css("[data-slot='carousel-item']")
    expect(item.attributes.transform_values(&:value)).to include(
      "role" => "group",
      "aria-roledescription" => "slide",
      "aria-label" => "1 of 1"
    )
  end

  it "keeps the upstream viewport and track DOM while adding root-driven orientation classes" do
    render_inline(CarouselComposition.new)

    root = rendered_root_element
    viewport = root.element_children.first
    track = viewport.element_children.first
    item = track.element_children.first

    expect(viewport["data-slot"]).to eq("carousel-content")
    expect(viewport["class"].split).to eq(["overflow-hidden"])
    expect(track["class"].split).to include(
      "flex",
      "-ml-4",
      "group-data-vertical/carousel:ml-0",
      "group-data-vertical/carousel:-mt-4",
      "group-data-vertical/carousel:flex-col"
    )
    expect(item["class"].split).to include(
      "min-w-0",
      "basis-full",
      "pl-4",
      "group-data-vertical/carousel:pl-0",
      "group-data-vertical/carousel:pt-4"
    )
  end

  it "renders upstream navigation defaults, vertical overrides, and horizontal-only RTL icon flipping" do
    render_inline(CarouselComposition.new)

    previous = rendered_root_element.at_css("[data-slot='carousel-previous']")
    next_button = rendered_root_element.at_css("[data-slot='carousel-next']")

    expect(previous["type"]).to eq("button")
    expect(previous["disabled"]).to eq("disabled")
    expect(previous["class"].split).to include(
      "size-7",
      "inset-y-0",
      "-left-12",
      "group-data-vertical/carousel:inset-y-auto",
      "group-data-vertical/carousel:-top-12",
      "group-data-vertical/carousel:rotate-90"
    )
    expect(next_button["class"].split).to include(
      "size-7",
      "-right-12",
      "group-data-vertical/carousel:right-auto",
      "group-data-vertical/carousel:-bottom-12"
    )

    previous_svg = previous.at_css("svg")
    next_svg = next_button.at_css("svg")
    rtl_class = "group-[[data-orientation=horizontal][data-direction=rtl]]/carousel:rotate-180"
    expect(previous_svg["class"].split).to include("size-4", rtl_class)
    expect(next_svg["class"].split).to include("size-4", rtl_class)
    expect(previous_svg.css("path").map { |path| path["d"] }).to eq(["m15 18-6-6 6-6"])
    expect(next_svg.css("path").map { |path| path["d"] }).to eq(["m9 18 6-6-6-6"])
    expect(previous_svg["aria-hidden"]).to eq("true")
    expect(previous.at_css(".sr-only").text).to eq("Previous slide")
    expect(next_button.at_css(".sr-only").text).to eq("Next slide")
  end

  it "preserves navigation overrides without replacing the required action" do
    render_inline(Shadcn::Carousel::Previous.new(
                    variant: :ghost,
                    size: :icon,
                    data: { action: "click->preview#record", testid: "previous" }
                  ))

    button = rendered_root_element
    expect(button["class"].split).to include("size-8", "hover:bg-muted")
    expect(button["data-testid"]).to eq("previous")
    expect(button["data-action"].split).to contain_exactly(
      "shadcn--carousel#scrollPrevious",
      "click->preview#record"
    )
  end

  it "preserves a supplied root ID without marking it as generated" do
    render_inline(described_class.new(id: "featured", tabindex: -1, aria: { labelledby: "featured-title" }))

    expect(rendered_root_element["id"]).to eq("featured")
    expect(rendered_root_element["tabindex"]).to eq("-1")
    expect(rendered_root_element["aria-labelledby"]).to eq("featured-title")
    expect(rendered_root_element).not_to have_attribute("data-shadcn-generated-root-id")
  end
end
