# frozen_string_literal: true

require "rails_helper"

class ComboboxChipsComposition < ViewComponent::Base
  def call
    render(Shadcn::Combobox::Chips.new) do
      safe_join([
                  render(Shadcn::Combobox::Chip.new(value: :rails)) { "Rails" },
                  render(Shadcn::Combobox::ChipsInput.new(id: "tags-query"))
                ])
    end
  end
end

RSpec.describe Shadcn::Combobox, type: :component do
  it "renders a single canonical form control with the submitted value and native constraints" do
    render_inline(described_class.new(
                    id: "framework-combobox",
                    name: :framework,
                    default_value: :rails,
                    required: true,
                    form: :profile_form
                  )) { "Content" }

    expect(rendered_root_element["data-controller"]).to eq("shadcn--combobox")
    control = rendered_fragment.at_css("select[data-slot='combobox-form-control']")
    expect(control.attributes.transform_values(&:value)).to include(
      "id" => "framework-combobox-form-control",
      "name" => "framework",
      "form" => "profile_form",
      "required" => "required",
      "tabindex" => "-1",
      "aria-hidden" => "true"
    )
    expect(control).not_to have_attribute("multiple")
    expect(control["style"]).to include("clip-path: inset(50%)", "position: absolute")
    expect(control.css("option[selected]").map { |option| option["value"] }).to eq(["rails"])
  end

  it "normalizes multiple initial values and omits a disabled field from submission" do
    render_inline(described_class.new(
                    name: "profile[tags][]",
                    default_value: ["rails", "", nil, :rails, :hanami],
                    multiple: true,
                    disabled: true,
                    required: true
                  )) { "Content" }

    expect(rendered_root_element).to have_attribute("inert")
    expect(rendered_root_element["aria-disabled"]).to eq("true")
    control = rendered_fragment.at_css("select[data-slot='combobox-form-control']")
    expect(control).to have_attribute("multiple")
    expect(control).to have_attribute("disabled")
    expect(control).to have_attribute("required")
    expect(control["name"]).to eq("profile[tags][]")
    expect(control.css("option[selected]").map { |option| option["value"] }).to eq(%w[rails hanami])
    empty_control = rendered_fragment.at_css("input[data-slot='combobox-empty-form-control']")
    expect(empty_control.attributes.transform_values(&:value)).to include(
      "type" => "hidden",
      "name" => "profile[tags][]",
      "value" => "",
      "disabled" => "disabled"
    )
  end

  it "submits an explicit empty value for an empty single field and an empty-array marker for chips" do
    render_inline(described_class.new(name: "profile[framework]")) { "Content" }

    control = rendered_fragment.at_css("select[data-slot='combobox-form-control']")
    expect(control.css("option[selected]").map { |option| option["value"] }).to eq([""])

    render_inline(described_class.new(name: "profile[tags][]", default_value: [], multiple: true)) { "Content" }
    empty_control = rendered_fragment.at_css("input[data-slot='combobox-empty-form-control']")
    expect(empty_control["name"]).to eq("profile[tags][]")
    expect(empty_control["value"]).to eq("")
    expect(empty_control).not_to have_attribute("disabled")
  end

  it "keeps query input attributes on the real input and reserves form ownership for the root" do
    render_inline(Shadcn::Combobox::Input.new(
                    id: "framework-query",
                    placeholder: "検索",
                    autocomplete: "off",
                    autofocus: true,
                    aria: { label: "フレームワーク検索" },
                    data: { testid: "query" }
                  ))

    expect(rendered_root_element.name).to eq("div")
    expect(rendered_root_element).not_to have_attribute("data-slot")
    input = rendered_fragment.at_css("input[role='combobox']")
    expect(input.attributes.transform_values(&:value)).to include(
      "id" => "framework-query",
      "type" => "search",
      "placeholder" => "検索",
      "autocomplete" => "off",
      "autofocus" => "autofocus",
      "aria-label" => "フレームワーク検索",
      "aria-expanded" => "false",
      "data-testid" => "query",
      "data-action" => "input->shadcn--combobox#filter"
    )
    expect(rendered_root_element).not_to have_attribute("id")

    %i[name form required disabled value multiple].each do |attribute|
      expect { Shadcn::Combobox::Input.new(**{ attribute => "value" }) }
        .to raise_error(ArgumentError, /#{attribute} belongs to Shadcn::Combobox/)
      expect { Shadcn::Combobox::ChipsInput.new(**{ attribute => "value" }) }
        .to raise_error(ArgumentError, /#{attribute} belongs to Shadcn::Combobox/)
    end
  end

  it "requires canonical Item and Chip values and renders a reusable chip template" do
    render_inline(Shadcn::Combobox::Item.new(value: :hanami, disabled: true)) { "Hanami" }

    expect(rendered_root_element.attributes.transform_values(&:value)).to include(
      "data-value" => "hanami",
      "data-selected" => "false",
      "data-disabled" => "",
      "aria-selected" => "false",
      "aria-disabled" => "true"
    )
    expect(rendered_root_element).not_to have_attribute("data-highlighted")

    render_inline(ComboboxChipsComposition.new)
    chip = rendered_fragment.at_css("[data-slot='combobox-chip'][data-value='rails']")
    expect(chip.at_css("[data-slot='combobox-chip-label']").text).to eq("Rails")
    expect(chip.at_css("[data-slot='combobox-chip-remove'][type='button']")).not_to be_nil
    expect(rendered_fragment.at_css("template[data-slot='combobox-chip-template']")).not_to be_nil
    chips_input = rendered_fragment.at_css("#tags-query")
    expect(chips_input.attributes.transform_values(&:value)).to include(
      "role" => "combobox",
      "aria-expanded" => "false",
      "aria-haspopup" => "listbox",
      "data-action" => "input->shadcn--combobox#filter"
    )

    expect { Shadcn::Combobox::Item.new }.to raise_error(ArgumentError, /missing keyword: :value/)
    expect { Shadcn::Combobox::Chip.new }.to raise_error(ArgumentError, /missing keyword: :value/)
    expect { Shadcn::Combobox::Item.new(value: "") }.to raise_error(ArgumentError, /must not be blank/)
    expect { Shadcn::Combobox::Chip.new(value: " ") }.to raise_error(ArgumentError, /must not be blank/)
  end

  it "rejects scalar and array defaults that disagree with multiple" do
    expect { described_class.new(default_value: ["rails"]) }
      .to raise_error(ArgumentError, /scalar when multiple is false/)
    expect { described_class.new(default_value: "rails", multiple: true) }
      .to raise_error(ArgumentError, /Array when multiple is true/)
    expect { described_class.new(default_value: {}) }
      .to raise_error(ArgumentError, /default_value must be a String, Symbol, Integer, or Float/)
    render_inline(described_class.new(name: "framework", default_value: "  ")) { "Content" }
    expect(rendered_fragment.at_css("select option")["value"]).to eq("")
    expect { Shadcn::Combobox::Item.new(value: {}) }
      .to raise_error(ArgumentError, /value must be a String, Symbol, Integer, or Float/)
    expect { Shadcn::Combobox::Chip.new(value: {}) }
      .to raise_error(ArgumentError, /value must be a String, Symbol, Integer, or Float/)
  end
  it "uses a manual popover so interacting with the query input does not light-dismiss the list" do
    render_inline(Shadcn::Combobox::Content.new)

    expect(rendered_root_element["popover"]).to eq("manual")
  end
end
