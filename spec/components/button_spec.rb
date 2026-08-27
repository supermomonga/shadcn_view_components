# frozen_string_literal: true

# コンポーネントスペック(層1 — 07-testing §4)。
# 適合試験と重複しないRuby APIのふるまいを検証する。
require "rails_helper"

RSpec.describe Shadcn::Button, type: :component do
  it "renders a button element with the default contract classes" do
    render_inline(described_class.new) { "保存" }

    expect(rendered_root_element.name).to eq("button")
    expect(rendered_root_element["class"]).to eq(
      ShadcnViewComponents::Contracts::Button::COMBINATIONS.fetch(variant: :default, size: :default)
    )
  end

  it "accepts string variant values and normalizes them" do
    render_inline(described_class.new(variant: "outline", size: "sm")) { "x" }

    expect(rendered_root_element["class"]).to eq(
      ShadcnViewComponents::Contracts::Button::COMBINATIONS.fetch(variant: :outline, size: :sm)
    )
  end

  it "raises ArgumentError for an unknown variant value (fail-fast)" do
    expect { described_class.new(variant: :nope) }.to raise_error(ArgumentError, /unknown variant value/)
  end

  it "passes unknown kwargs through as HTML attributes (バリアントpropはfail-fast、属性はパススルー)" do
    render_inline(described_class.new(tone: :dark)) { "x" }

    expect(rendered_root_element["tone"]).to eq("dark")
  end

  describe "tag replacement (asChild alternative — 04 §3.3)" do
    it "renders an <a> with the same classes and data-slot" do
      nil
      render_inline(described_class.new) { "x" }
      default_classes = rendered_root_element["class"]

      render_inline(described_class.new(tag: :a, href: "/x")) { "x" }

      expect(rendered_root_element.name).to eq("a")
      expect(rendered_root_element["href"]).to eq("/x")
      expect(rendered_root_element["data-slot"]).to eq("button")
      expect(rendered_root_element["class"]).to eq(default_classes)
    end
  end

  describe "user class merging (tailwind-merge, 後勝ち — 04 §6)" do
    it "lets the user override contract utilities" do
      render_inline(described_class.new(class: "h-14 w-full")) { "x" }

      classes = rendered_root_element["class"].split
      expect(classes).to include("h-14")
      expect(classes).to include("w-full")
      expect(classes).not_to include("h-9")
    end

    it "keeps contract classes when no user class is given (byte-exact)" do
      render_inline(described_class.new(variant: :secondary)) { "x" }

      expect(rendered_root_element["class"]).to eq(
        ShadcnViewComponents::Contracts::Button::COMBINATIONS.fetch(variant: :secondary, size: :default)
      )
    end
  end

  it "passes through HTML attributes (disabled, type, data)" do
    render_inline(described_class.new(disabled: true, type: :submit, data: { controller: "x" })) { "x" }

    expect(rendered_root_element["disabled"]).to eq("disabled")
    expect(rendered_root_element["type"]).to eq("submit")
    expect(rendered_root_element["data-controller"]).to eq("x")
    expect(rendered_root_element["data-slot"]).to eq("button")
  end

  it "renders upstream's dynamic attributes (data-variant / data-size)" do
    render_inline(described_class.new(variant: :outline, size: :sm)) { "x" }

    expect(rendered_root_element["data-variant"]).to eq("outline")
    expect(rendered_root_element["data-size"]).to eq("sm")
  end

  it "escapes hostile attribute values" do
    hostile = '"><script>alert(1)</script>'
    render_inline(described_class.new(class: hostile)) { "x" }

    expect(rendered_content).not_to include("<script>alert(1)</script>")
  end

  describe ".classes module function (04 §8)" do
    it "returns the pre-resolved contract string without rendering" do
      expect(described_class.classes(variant: :link, size: :lg)).to eq(
        ShadcnViewComponents::Contracts::Button::COMBINATIONS.fetch(variant: :link, size: :lg)
      )
    end

    it "applies contract defaults for omitted options" do
      expect(described_class.classes(variant: :ghost)).to eq(
        ShadcnViewComponents::Contracts::Button::COMBINATIONS.fetch(variant: :ghost, size: :default)
      )
    end
  end
end
