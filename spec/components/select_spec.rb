# frozen_string_literal: true

require "rails_helper"

class SelectComposition < ViewComponent::Base
  def call
    render(Shadcn::Select.new(id: "framework-select", name: "framework", default_value: "rails")) do
      safe_join([trigger, popup])
    end
  end

  private

  def trigger
    render(Shadcn::Select::Trigger.new) do
      render(Shadcn::Select::Value.new(placeholder: "選択してください"))
    end
  end

  def popup
    render(Shadcn::Select::Content.new(id: "framework-popup")) do
      render(Shadcn::Select::Group.new) { safe_join(options) }
    end
  end

  def options
    [
      render(Shadcn::Select::Label.new) { "フレームワーク" },
      render(Shadcn::Select::Item.new(value: "rails")) { "Ruby on Rails" },
      render(Shadcn::Select::Item.new(value: "disabled", disabled: true)) { "利用不可" },
      render(Shadcn::Select::Separator.new),
      render(Shadcn::Select::Item.new(value: "hanami")) { "Hanami" }
    ]
  end
end

RSpec.describe Shadcn::Select, type: :component do
  it "renders the empty primitive-root contract and its form value without raising" do
    render_inline(described_class.new(name: :kind, default_value: :rails, class: "w-full", tag: :section)) { "" }

    expect(rendered_root_element.name).to eq("section")
    expect(rendered_root_element["data-slot"]).to eq("select")
    expect(rendered_root_element["data-controller"]).to eq("shadcn--select")
    expect(rendered_root_element["data-action"]).to eq(
      "keydown->shadcn--select#navigate focusout->shadcn--select#focusOut"
    )
    expect(rendered_root_element["class"]).to eq("w-full")
    expect(described_class.classes).to eq("")

    input = rendered_fragment.at_css("input[data-slot='select-input']")
    expect(input.attributes.transform_values(&:value)).to include(
      "type" => "hidden",
      "name" => "kind",
      "value" => "rails",
      "data-value-present" => "true"
    )
    expect(rendered_content).not_to include("</input>")
  end

  it "renders the complete combobox, popup, listbox, and option structure" do
    render_inline(SelectComposition.new)

    trigger = rendered_fragment.at_css("[data-slot='select-trigger']")
    expect(trigger.name).to eq("button")
    expect(trigger.attributes.transform_values(&:value)).to include(
      "type" => "button",
      "role" => "combobox",
      "aria-haspopup" => "listbox",
      "aria-expanded" => "false",
      "data-size" => "default",
      "data-action" => "click->shadcn--select#toggle"
    )
    expect(trigger.at_css("[data-slot='select-value']").text).to eq("選択してください")
    expect(trigger.css("svg").length).to eq(1)

    popup = rendered_fragment.at_css("[data-slot='select-content']")
    expect(popup.attributes.transform_values(&:value)).to include(
      "id" => "framework-popup",
      "role" => "presentation",
      "popover" => "auto",
      "data-state" => "closed",
      "data-closed" => ""
    )
    expect(popup["style"]).to eq(
      "display: flex; flex-direction: column; overflow: hidden"
    )
    listbox = popup.at_css("[role='listbox']")
    expect(listbox).not_to be_nil
    expect(listbox["style"]).to eq(
      "position: relative; min-height: 0; flex: 1 1 auto; overflow-x: hidden; overflow-y: auto"
    )
    expect(popup.css("[data-slot='select-scroll-up-button']").length).to eq(1)
    expect(popup.css("[data-slot='select-scroll-down-button']").length).to eq(1)
    scroll_up = popup.at_css("[data-slot='select-scroll-up-button']")
    scroll_down = popup.at_css("[data-slot='select-scroll-down-button']")
    expect(scroll_up.attributes.transform_values(&:value)).to include(
      "hidden" => "hidden",
      "aria-hidden" => "true",
      "data-scroll-direction" => "up",
      "style" => "position: absolute"
    )
    expect(scroll_down["data-scroll-direction"]).to eq("down")
    expect(scroll_down["data-action"]).to include("mouseenter->shadcn--select#startScroll")

    disabled = rendered_fragment.at_css("[data-value='disabled']")
    expect(disabled["role"]).to eq("option")
    expect(disabled["aria-selected"]).to eq("false")
    expect(disabled["aria-disabled"]).to eq("true")
    expect(disabled).to have_attribute("data-disabled")
    expect(disabled["data-action"]).to include("click->shadcn--select#select")
    expect(disabled.at_css("[data-indicator]")).to have_attribute("hidden")
  end

  it "requires every item to declare its form value" do
    expect { Shadcn::Select::Item.new }.to raise_error(ArgumentError, /missing keyword: :value/)
  end

  it "publishes and validates the Select trigger size contract" do
    expect(Shadcn::Select::Trigger.property_contract(:size)).to eq(
      kind: :enum,
      default: "default",
      values: %w[default sm]
    )
    expect { Shadcn::Select::Trigger.new(size: :large) }
      .to raise_error(ArgumentError, /size must be one of/)
  end

  it "keeps NativeSelect decoration size off the native size attribute" do
    render_inline(Shadcn::NativeSelect.new(size: :sm, name: "native"))

    wrapper = rendered_root_element
    native = rendered_fragment.at_css("select[data-slot='native-select']")
    expect(wrapper["data-size"]).to eq("sm")
    expect(native["data-size"]).to eq("sm")
    expect(native["size"]).to be_nil
    expect(native["name"]).to eq("native")
  end
end
