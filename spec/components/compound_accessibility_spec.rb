# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Compound component accessibility roots", type: :component do
  root_components = [
    Shadcn::Dialog,
    Shadcn::AlertDialog,
    Shadcn::Sheet,
    Shadcn::Drawer,
    Shadcn::Tabs,
    Shadcn::Accordion
  ]

  root_components.each do |component_class|
    it "assigns one marked SSR root ID to #{component_class}" do
      render_inline(component_class.new)

      expect(rendered_root_element["id"]).to match(/\Ashadcn-[a-z-]+-[0-9a-f]{24}\z/)
      expect(rendered_root_element["data-shadcn-generated-root-id"]).to eq("true")
    end

    it "preserves a consumer root ID on #{component_class}" do
      render_inline(component_class.new(id: "consumer-root"))

      expect(rendered_root_element["id"]).to eq("consumer-root")
      expect(rendered_root_element["data-shadcn-generated-root-id"]).to be_nil
    end
  end

  it "gives a standalone Accordion::Item an SSR root ID and controller" do
    render_inline(Shadcn::Accordion::Item.new)

    expect(rendered_root_element["id"]).to match(/\Ashadcn-accordion-item-[0-9a-f]{24}\z/)
    expect(rendered_root_element["data-controller"].split).to include("shadcn--accordion")
    expect(rendered_root_element["data-shadcn-generated-root-id"]).to eq("true")
  end
end

RSpec.describe Shadcn::Tabs, type: :component do
  it "requires a non-empty String value for triggers and panels" do
    expect { Shadcn::Tabs::Trigger.new }.to raise_error(ArgumentError, /missing keyword: :value/)
    expect { Shadcn::Tabs::Content.new }.to raise_error(ArgumentError, /missing keyword: :value/)
    expect { Shadcn::Tabs::Trigger.new(value: "  ") }
      .to raise_error(ArgumentError, "value must be a non-empty String")
    expect { Shadcn::Tabs::Content.new(value: :account) }
      .to raise_error(ArgumentError, "value must be a non-empty String")
  end

  it "leaves list orientation to the root controller while preserving explicit ARIA" do
    render_inline(Shadcn::Tabs::List.new)
    expect(rendered_root_element["aria-orientation"]).to be_nil

    render_inline(Shadcn::Tabs::List.new(aria: { orientation: "vertical" }))
    expect(rendered_root_element["aria-orientation"]).to eq("vertical")
  end
end
