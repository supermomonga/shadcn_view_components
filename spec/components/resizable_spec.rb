# frozen_string_literal: true

require "rails_helper"

class ResizableComposition < ViewComponent::Base
  def initialize(group_args: {}, handle_args: {})
    @group_args = group_args
    @handle_args = handle_args
    super()
  end

  def call
    render(Shadcn::Resizable::PanelGroup.new(**@group_args)) do
      safe_join([
                  render(Shadcn::Resizable::Panel.new) { "左" },
                  render(Shadcn::Resizable::Handle.new(**@handle_args)),
                  render(Shadcn::Resizable::Panel.new) { "右" }
                ])
    end
  end
end

RSpec.describe Shadcn::Resizable::PanelGroup, type: :component do
  it "renders a generated accessibility root and separator value defaults" do
    render_inline(ResizableComposition.new)

    root = rendered_root_element
    expect(root["id"]).to match(/\Ashadcn-resizable-[0-9a-f]{24}\z/)
    expect(root["data-shadcn-generated-root-id"]).to eq("true")
    expect(root["data-controller"]).to eq("shadcn--resizable")

    handle = root.at_css("[data-slot='resizable-handle']")
    expect(handle.attributes.transform_values(&:value)).to include(
      "role" => "separator",
      "tabindex" => "0",
      "aria-valuemin" => "10",
      "aria-valuemax" => "90",
      "aria-valuenow" => "50"
    )
  end

  it "preserves user IDs and ARIA values" do
    render_inline(ResizableComposition.new(
                    group_args: { id: "layout", aria: { label: "編集レイアウト" } },
                    handle_args: {
                      id: "custom-handle",
                      aria: { label: "左右幅", valuemin: "20", valuemax: "80", valuenow: "30" }
                    }
                  ))

    expect(rendered_root_element["id"]).to eq("layout")
    expect(rendered_root_element["aria-label"]).to eq("編集レイアウト")
    expect(rendered_root_element).not_to have_attribute("data-shadcn-generated-root-id")
    handle = rendered_root_element.at_css("#custom-handle")
    expect(handle.attributes.transform_values(&:value)).to include(
      "aria-label" => "左右幅",
      "aria-valuemin" => "20",
      "aria-valuemax" => "80",
      "aria-valuenow" => "30"
    )
  end
end
