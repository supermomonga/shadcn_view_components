# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Floating position options", type: :component do
  defaults = {
    Shadcn::Popover::Content => {
      side: "bottom", align: "center", side_offset: "4", align_offset: "0"
    },
    Shadcn::Tooltip::Content => {
      side: "top", align: "center", side_offset: "4", align_offset: "0"
    },
    Shadcn::HoverCard::Content => {
      side: "bottom", align: "center", side_offset: "4", align_offset: "4"
    },
    Shadcn::DropdownMenu::Content => {
      side: "bottom", align: "start", side_offset: "4", align_offset: "0"
    },
    Shadcn::DropdownMenu::SubContent => {
      side: "right", align: "start", side_offset: "0", align_offset: "-3"
    },
    Shadcn::ContextMenu::Content => {
      side: "right", align: "start", side_offset: "0", align_offset: "4"
    },
    Shadcn::ContextMenu::SubContent => {
      side: "right", align: "start", side_offset: "0", align_offset: "4"
    },
    Shadcn::Menubar::Content => {
      side: "bottom", align: "start", side_offset: "8", align_offset: "-4"
    },
    Shadcn::NavigationMenu::Content => {
      side: "bottom", align: "start", side_offset: "8", align_offset: "0"
    }
  }

  defaults.each do |component_class, expected|
    it "renders upstream positioning defaults for #{component_class}" do
      render_inline(component_class.new) { "Content" }

      element = rendered_fragment.at_css("[data-position-side]")
      expect(element).not_to be_nil
      expect(element.attributes.transform_values(&:value)).to include(
        "data-position-side" => expected.fetch(:side),
        "data-position-align" => expected.fetch(:align),
        "data-position-side-offset" => expected.fetch(:side_offset),
        "data-position-align-offset" => expected.fetch(:align_offset),
        "data-position-collision-padding" => "5"
      )
    end
  end

  it "accepts string and symbol choices plus finite numeric overrides" do
    render_inline(
      Shadcn::Popover::Content.new(
        side: :"inline-end",
        align: "end",
        side_offset: "6.5",
        align_offset: -2,
        collision_padding: "7"
      )
    ) { "Content" }

    expect(rendered_root_element.attributes.transform_values(&:value)).to include(
      "data-position-side" => "inline-end",
      "data-position-align" => "end",
      "data-position-side-offset" => "6.5",
      "data-position-align-offset" => "-2",
      "data-position-collision-padding" => "7"
    )
  end

  it "lets user data override generated positioning data" do
    render_inline(
      Shadcn::Popover::Content.new(
        side: :bottom,
        data: {
          position_side: "left",
          position_collision_padding: 9,
          owner: "application"
        }
      )
    ) { "Content" }

    expect(rendered_root_element.attributes.transform_values(&:value)).to include(
      "data-position-side" => "left",
      "data-position-collision-padding" => "9",
      "data-owner" => "application"
    )
  end

  invalid_options = {
    { side: :diagonal } => /unknown floating position side/,
    { side: nil } => /unknown floating position side/,
    { align: :baseline } => /unknown floating position align/,
    { side_offset: "4px" } => /side_offset must be a finite number/,
    { align_offset: Float::INFINITY } => /align_offset must be a finite number/,
    { collision_padding: -1 } => /collision_padding must be a finite non-negative number/
  }

  invalid_options.each do |options, message|
    it "rejects invalid positioning option #{options.inspect}" do
      expect { Shadcn::Popover::Content.new(**options) }.to raise_error(ArgumentError, message)
    end
  end
end
