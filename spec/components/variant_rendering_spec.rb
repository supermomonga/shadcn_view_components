# frozen_string_literal: true

require "rails_helper"

class ToggleGroupComposition < ViewComponent::Base
  def initialize(variant: :outline, size: :sm, spacing: 0)
    @variant = variant
    @size = size
    @spacing = spacing
    super()
  end

  def call
    safe_join([
                render(Shadcn::ToggleGroup.new(variant: @variant, size: @size, spacing: @spacing)) do
                  render(Shadcn::ToggleGroup::Item.new(variant: :default, size: :default, spacing: 2)) { "親の中" }
                end,
                render(Shadcn::ToggleGroup::Item.new) { "親の外" }
              ])
  end
end

RSpec.describe "variant dependent rendering", type: :component do
  it "composes InputGroup Button classes with the Button variant and the group size" do
    render_inline(Shadcn::InputGroup::Button.new(variant: :destructive, size: :xs, type: :submit)) { "保存" }

    button = rendered_root_element
    expect(button["type"]).to eq("submit")
    expect(button["data-size"]).to eq("xs")
    expect(button["class"]).to include("group/button", "focus-visible:ring-3", "h-6", "px-1.5")
    expect(button["class"]).to include("bg-destructive")
    expect(Shadcn::InputGroup::Button.classes(variant: :destructive, size: :xs)).to eq(button["class"])
    expect(Shadcn::InputGroup::Button.classes(variant: :ghost, size: :xs)).not_to eq(button["class"])
  end

  it "uses Button styling for Attachment Action, Sidebar Trigger, and MessageScroller Button" do
    {
      Shadcn::Attachment::Action => { classes: %w[group/button focus-visible:ring-3 size-6] },
      Shadcn::Sidebar::Trigger => { classes: %w[group/button focus-visible:ring-3 size-7] },
      Shadcn::MessageScroller::Button => { classes: %w[group/button focus-visible:ring-3 size-7] }
    }.each do |component, expected|
      render_inline(component.new)
      expect(rendered_root_element["class"].split).to include(*expected.fetch(:classes))
      expect(component.classes).to eq(rendered_root_element["class"])
    end
  end

  it "applies explicit Button options to Attachment Action and MessageScroller Button" do
    [Shadcn::Attachment::Action, Shadcn::MessageScroller::Button].each do |component|
      render_inline(component.new(variant: :destructive, size: :"icon-xs"))
      expect(rendered_root_element["class"]).to eq(component.classes(variant: :destructive, size: :"icon-xs"))
      expect(rendered_root_element["class"]).to include("size-6", "focus-visible:ring-3")
    end
  end

  it "emits variant and size data attributes used by selector classes" do
    cases = [
      [Shadcn::DropdownMenu::Item, { variant: :destructive }, { "data-variant" => "destructive" }],
      [Shadcn::ContextMenu::Item, { variant: :destructive }, { "data-variant" => "destructive" }],
      [Shadcn::Menubar::Item, { variant: :destructive }, { "data-variant" => "destructive" }],
      [Shadcn::Field::Legend, { variant: :label }, { "data-variant" => "label" }],
      [Shadcn::Card, { size: :sm }, { "data-size" => "sm" }],
      [Shadcn::Message, { align: :end }, { "data-align" => "end" }],
      [Shadcn::Attachment, { orientation: :vertical, size: :sm },
       { "data-orientation" => "vertical", "data-size" => "sm" }],
      [Shadcn::Attachment::Media, { variant: :icon }, { "data-variant" => "icon" }],
      [Shadcn::Bubble, { variant: :ghost, align: :end },
       { "data-variant" => "ghost", "data-align" => "end" }],
      [Shadcn::Bubble::Reactions, { align: :end, side: :top },
       { "data-align" => "end", "data-side" => "top" }],
      [Shadcn::ButtonGroup, { orientation: :vertical }, { "data-orientation" => "vertical" }],
      [Shadcn::Sidebar::MenuButton, { size: :sm }, { "data-size" => "sm" }]
    ]

    cases.each do |component, options, attributes|
      render_inline(component.new(**options)) { "内容" }
      attributes.each do |name, value|
        expect(rendered_root_element[name]).to eq(value), "#{component} #{name}"
      end
    end
  end

  it "uses the group variant, size, and spacing only while rendering its children" do
    render_inline(ToggleGroupComposition.new)
    items = rendered_fragment.css("[data-slot='toggle-group-item']")

    expect(items.map { |item| item["data-variant"] }).to eq(%w[outline default])
    expect(items.map { |item| item["data-size"] }).to eq(%w[sm default])
    expect(items.map { |item| item["data-spacing"] }).to eq(%w[0 2])
    expect(items.first["class"]).to eq(Shadcn::ToggleGroup::Item.classes(variant: :outline, size: :sm))
  end

  it "selects the generated Sidebar classes for each variant and keeps side and collapse state in sync" do
    render_inline(Shadcn::Sidebar.new(variant: :floating, side: :right, collapsible: :icon, state: :closed)) { "項目" }

    root = rendered_root_element
    gap = root.at_css("[data-slot='sidebar-gap']")
    container = root.at_css("[data-slot='sidebar-container']")
    expect(root.attributes.transform_values(&:value)).to include(
      "data-variant" => "floating", "data-side" => "right", "data-collapsible" => "icon",
      "data-collapsible-mode" => "icon"
    )
    expect(gap["class"]).to include("--spacing(4)")
    expect(container["class"]).to include("p-2", "--spacing(4)")
    expect(container["data-side"]).to eq("right")

    render_inline(Shadcn::Sidebar.new(variant: :sidebar, state: :open))
    expect(rendered_root_element.at_css("[data-slot='sidebar-container']")["class"]).to include("border-r")
    expect(rendered_root_element["data-collapsible"]).to eq("")

    render_inline(Shadcn::Sidebar.new(collapsible: :none)) { "固定" }
    expect(rendered_root_element["class"]).to eq(Shadcn::Sidebar.classes)
    expect(rendered_fragment.css("[data-slot='sidebar-gap']")).to be_empty
  end
end
