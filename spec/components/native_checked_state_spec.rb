# frozen_string_literal: true

require "rails_helper"

class NativeRadioGroupComposition < ViewComponent::Base
  def call
    render(Shadcn::RadioGroup.new(aria: { label: "プラン" })) do
      render(Shadcn::RadioGroup::Item.new(name: "plan", value: "free", checked: true))
    end
  end
end

RSpec.describe "Native checked controls", type: :component do
  shared_examples "a native checked control" do |component_class, type, role|
    it "renders checked as the exclusive initial data state" do
      render_inline(component_class.new(checked: true, aria: { label: "選択" }))

      input = rendered_fragment.at_css("input")
      expect(input["type"]).to eq(type)
      expect(input["checked"]).to eq("checked")
      expect(input).to have_attribute("data-checked")
      expect(input).not_to have_attribute("data-unchecked")
      expect(input["aria-label"]).to eq("選択")
      expect(input["aria-checked"]).to be_nil
      expect(input["role"]).to eq(role) if role
    end

    it "renders unchecked as the exclusive initial data state" do
      render_inline(component_class.new(checked: false))

      input = rendered_fragment.at_css("input")
      expect(input["checked"]).to be_nil
      expect(input).to have_attribute("data-unchecked")
      expect(input).not_to have_attribute("data-checked")
    end

    it "keeps internal state authoritative and composes user data tokens" do
      render_inline(component_class.new(
                      checked: true,
                      data: {
                        checked: "false",
                        unchecked: "",
                        controller: "preview shadcn--checked-state",
                        action: "click->preview#record change->shadcn--checked-state#sync",
                        testid: "control"
                      }
                    ))

      input = rendered_fragment.at_css("input")
      expect(input).to have_attribute("data-checked")
      expect(input).not_to have_attribute("data-unchecked")
      expect(input["data-controller"].split).to eq(%w[shadcn--checked-state preview])
      expect(input["data-action"].split).to eq(
        %w[change->shadcn--checked-state#sync click->preview#record]
      )
      expect(input["data-testid"]).to eq("control")
    end

    it "normalizes an explicitly supplied aria-checked without adding it by default" do
      render_inline(component_class.new(checked: false, aria: { checked: "true", describedby: "hint" }))

      input = rendered_fragment.at_css("input")
      expect(input["aria-checked"]).to eq("false")
      expect(input["aria-describedby"]).to eq("hint")
    end

    it "passes native form attributes to the input and renders it as a void element" do
      render_inline(component_class.new(
                      id: "control",
                      name: "settings[choice]",
                      value: "yes",
                      form: "settings-form",
                      required: true,
                      disabled: true
                    ))

      input = rendered_fragment.at_css("input")
      expect(input.attributes.slice("id", "name", "value", "form").transform_values(&:value)).to eq(
        "id" => "control",
        "name" => "settings[choice]",
        "value" => "yes",
        "form" => "settings-form"
      )
      expect(input).to have_attribute("required")
      expect(input).to have_attribute("disabled")
      expect(rendered_content).not_to include("</input>")
    end
  end

  include_examples "a native checked control", Shadcn::Checkbox, "checkbox", nil
  include_examples "a native checked control", Shadcn::RadioGroup::Item, "radio", nil
  include_examples "a native checked control", Shadcn::Switch, "checkbox", "switch"

  it "keeps checkbox, radio, and switch decoration out of the accessibility tree" do
    render_inline(Shadcn::Checkbox.new)
    checkbox_indicator = rendered_fragment.at_css("[data-slot='checkbox-indicator']")
    expect(checkbox_indicator["aria-hidden"]).to eq("true")
    expect(checkbox_indicator.parent["class"].split).to include("relative", "flex", "w-fit")
    expect(checkbox_indicator["class"]).to include("absolute", "inset-0")

    render_inline(Shadcn::RadioGroup::Item.new(name: "plan"))
    radio_indicator = rendered_fragment.at_css("[data-slot='radio-group-indicator']")
    expect(radio_indicator["aria-hidden"]).to eq("true")
    expect(radio_indicator.parent["class"].split).to include("relative", "flex", "w-fit")
    expect(radio_indicator["class"]).to include("absolute", "inset-0")

    render_inline(Shadcn::Switch.new)
    expect(rendered_fragment.at_css("[data-slot='switch-thumb']")["aria-hidden"]).to eq("true")
  end

  it "uses native pseudo-classes for no-JavaScript colors and mirrors Switch's initial thumb state" do
    render_inline(Shadcn::Checkbox.new(checked: true))
    expect(rendered_fragment.at_css("input")["class"]).to include("not-checked:bg-transparent", "checked:bg-primary")

    render_inline(Shadcn::RadioGroup::Item.new(name: "plan", checked: true))
    expect(rendered_fragment.at_css("input")["class"]).to include("not-checked:bg-transparent", "checked:bg-primary")

    render_inline(Shadcn::Switch.new(checked: true))
    expect(rendered_fragment.at_css("input")["class"]).to include("not-checked:bg-input", "checked:bg-primary")
    thumb = rendered_fragment.at_css("[data-slot='switch-thumb']")
    expect(thumb).to have_attribute("data-checked")
    expect(thumb["class"]).to include("peer-checked:translate-x-[calc(100%-2px)]", "peer-not-checked:translate-x-0")
  end

  it "keeps RadioGroup semantics separate from each Item's native form API" do
    render_inline(NativeRadioGroupComposition.new)

    root = rendered_fragment.at_css("[data-slot='radio-group']")
    item = rendered_fragment.at_css("input[type='radio']")
    expect(root["role"]).to eq("radiogroup")
    expect(root["aria-label"]).to eq("プラン")
    expect(item["name"]).to eq("plan")
    expect(item["value"]).to eq("free")
  end
end
