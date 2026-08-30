# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InputGroup and Progress composition", type: :component do
  describe Shadcn::InputGroup::Addon do
    it "emits the default alignment and preserves user data attributes" do
      render_inline(described_class.new(data: { controller: "example", testid: "addon" })) { "https://" }

      expect(rendered_root_element["data-align"]).to eq("inline-start")
      expect(rendered_root_element["data-controller"]).to eq("example")
      expect(rendered_root_element["data-testid"]).to eq("addon")
    end

    it "emits an explicitly selected alignment" do
      render_inline(described_class.new(align: :"block-end")) { "helper" }

      expect(rendered_root_element["data-align"]).to eq("block-end")
    end
  end

  describe Shadcn::InputGroup::Input do
    it "composes the base Input classes and preserves native attributes" do
      render_inline(described_class.new(type: :url, name: "website", data: { testid: "website" }))

      expect(rendered_root_element["class"]).to eq(
        ShadcnViewComponents::Classes.resolve(:input, extra: described_class.classes)
      )
      expect(rendered_root_element["data-slot"]).to eq("input-group-control")
      expect(rendered_root_element["data-testid"]).to eq("website")
      expect(rendered_root_element["name"]).to eq("website")
    end
  end

  describe Shadcn::InputGroup::Textarea do
    it "composes the base Textarea classes and preserves native attributes" do
      render_inline(described_class.new(name: "notes", rows: 4, data: { testid: "notes" })) { "本文" }

      expect(rendered_root_element["class"]).to eq(
        ShadcnViewComponents::Classes.resolve(:textarea, extra: described_class.classes)
      )
      expect(rendered_root_element["data-slot"]).to eq("input-group-control")
      expect(rendered_root_element["data-testid"]).to eq("notes")
      expect(rendered_root_element["name"]).to eq("notes")
      expect(rendered_root_element["rows"]).to eq("4")
      expect(rendered_root_element.text).to eq("本文")
    end
  end

  describe Shadcn::ButtonGroup::Separator do
    it "composes the standard vertical Separator and preserves user attributes" do
      render_inline(described_class.new(class: "opacity-50", data: { testid: "separator" }))

      expect(rendered_root_element["role"]).to eq("separator")
      expect(rendered_root_element["aria-orientation"]).to eq("vertical")
      expect(rendered_root_element["data-orientation"]).to eq("vertical")
      expect(rendered_root_element["data-slot"]).to eq("button-group-separator")
      expect(rendered_root_element["data-testid"]).to eq("separator")
      expect(rendered_root_element["class"].split).to include("opacity-50")
    end

    it "forwards an explicit horizontal orientation" do
      render_inline(described_class.new(orientation: :horizontal))

      expect(rendered_root_element["aria-orientation"]).to eq("horizontal")
      expect(rendered_root_element["data-orientation"]).to eq("horizontal")
    end
  end

  describe Shadcn::Progress do
    it "renders content followed by the contract Track and Indicator" do
      render_inline(described_class.new(value: 60, aria: { label: "進捗" })) { "読み込み中" }

      root = rendered_root_element
      track = root.element_children.find { |node| node["data-slot"] == "progress-track" }
      indicator = track.element_children.find { |node| node["data-slot"] == "progress-indicator" }

      expect(root.children.first.text).to eq("読み込み中")
      expect(track["class"]).to eq(ShadcnViewComponents::Classes.resolve(:progress_track))
      expect(indicator["class"]).to eq(ShadcnViewComponents::Classes.resolve(:progress_indicator))
      expect(indicator["style"]).to eq("width: 60%")
      expect(root["role"]).to eq("progressbar")
      expect(root["aria-label"]).to eq("進捗")
      expect(root["aria-valuemin"]).to eq("0")
      expect(root["aria-valuemax"]).to eq("100")
      expect(root["aria-valuenow"]).to eq("60")
    end
  end
end
