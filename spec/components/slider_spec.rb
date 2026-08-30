# frozen_string_literal: true

require "rails_helper"

RSpec.describe Shadcn::Slider, type: :component do
  it "routes form, ARIA, data, and event attributes to the native range input" do
    render_inline(described_class.new(
                    min: 10,
                    max: 90,
                    step: 5,
                    value: 40,
                    id: "volume",
                    name: "volume",
                    form: "settings",
                    disabled: true,
                    required: true,
                    aria: { label: "音量" },
                    data: { testid: "volume-control", action: "input->preview#record" },
                    onblur: "window.sliderBlurred = true",
                    class: "max-w-sm"
                  ))

    root = rendered_root_element
    input = root.at_css("input[data-slot='slider-input']")

    expect(root["class"].split).to include("max-w-sm")
    expect(root.attributes.transform_values(&:value)).not_to include(
      "id" => "volume",
      "name" => "volume",
      "form" => "settings",
      "aria-label" => "音量"
    )
    expect(input.attributes.transform_values(&:value)).to include(
      "type" => "range",
      "id" => "volume",
      "name" => "volume",
      "form" => "settings",
      "disabled" => "disabled",
      "required" => "required",
      "min" => "10",
      "max" => "90",
      "step" => "5",
      "value" => "40",
      "aria-label" => "音量",
      "aria-orientation" => "horizontal",
      "data-testid" => "volume-control",
      "onblur" => "window.sliderBlurred = true"
    )
    expect(input["data-action"]).to eq(
      "input->shadcn--slider#sync change->shadcn--slider#sync input->preview#record"
    )
  end

  it "renders the initial horizontal range and thumb from the input value" do
    render_inline(described_class.new(min: 0, max: 200, value: 50))

    root = rendered_root_element
    expect(root.attributes.transform_values(&:value)).to include(
      "data-controller" => "shadcn--slider",
      "data-orientation" => "horizontal"
    )
    expect(root.at_css("[data-slot='slider-range']")["style"])
      .to eq("position: absolute; left: 0; width: 25%")
    expect(root.at_css("[data-slot='slider-thumb']")["style"])
      .to eq("position: absolute; left: 25%; top: 50%; transform: translate(-50%, -50%)")
    expect(root.css("[data-orientation='horizontal']").length).to eq(4)

    expect(root.at_css("[data-slot='slider-track']")["class"].split).to include("relative", "grow")
    expect(root.at_css("[data-slot='slider-range']")["class"].split).to include("bg-primary")
    expect(root.at_css("[data-slot='slider-thumb']")["class"].split).to include("size-3", "border")

    control = root.element_children.first
    expect(control["class"].split).to include(
      "relative",
      "flex",
      "w-full",
      "data-vertical:flex-col"
    )
    control_children = control.element_children
    expect(control_children.map { |child| child["data-slot"] }).to eq(
      %w[slider-track slider-input slider-thumb]
    )
    expect(control_children[1]["class"].split).to include("peer")
    expect(control_children[2]["class"].split).to include(
      "peer-hover:ring-3",
      "peer-focus-visible:ring-3",
      "peer-active:ring-3",
      "peer-disabled:opacity-50"
    )
  end

  it "uses the native step-adjusted midpoint when value is omitted" do
    render_inline(described_class.new(min: 0, max: 10, step: 3, value: nil))

    input = rendered_root_element.at_css("input[data-slot='slider-input']")
    expect(input).not_to have_attribute("value")
    expect(rendered_root_element.at_css("[data-slot='slider-range']")["style"])
      .to include("width: 60%")
  end

  it "renders vertical geometry and native input orientation without leaking it to the root API" do
    render_inline(described_class.new(orientation: :vertical, value: 40, style: "accent-color: red"))

    root = rendered_root_element
    input = root.at_css("input[data-slot='slider-input']")
    expect(root["data-orientation"]).to eq("vertical")
    expect(root["style"]).to eq("accent-color: red")
    expect(input["aria-orientation"]).to eq("vertical")
    expect(input["style"]).to eq("writing-mode: vertical-lr; direction: rtl")
    expect(root.at_css("[data-slot='slider-range']")["style"])
      .to eq("position: absolute; bottom: 0; height: 40%")
    expect(root.at_css("[data-slot='slider-thumb']")["style"])
      .to eq("position: absolute; bottom: 40%; left: 50%; transform: translate(-50%, 50%)")
    expect(root.css("[data-orientation='vertical']").length).to eq(4)
  end

  it "keeps the decorative parts out of the accessibility tree and mirrors disabled state" do
    render_inline(described_class.new(disabled: true, aria: { label: "音量" }))

    root = rendered_root_element
    expect(root.css("[data-disabled]").length).to eq(4)
    expect(root.at_css("[data-slot='slider-thumb']")["aria-hidden"]).to eq("true")
    expect(root.at_css("input[type='range']")["disabled"]).to eq("disabled")
  end

  it "rejects values that the native input would silently move to another step" do
    expect { described_class.new(min: 0, max: 10, step: 3, value: 4) }
      .to raise_error(ArgumentError, /value must align with step from min/)
    expect { described_class.new(min: "0.1", max: "1", step: "0.1", value: "0.3") }
      .not_to raise_error
  end
end
