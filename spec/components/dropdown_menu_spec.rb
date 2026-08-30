# frozen_string_literal: true

require "rails_helper"

RSpec.describe Shadcn::DropdownMenu, type: :component do
  it "renders the submenu trigger action instead of the inherited item action" do
    render_inline(Shadcn::DropdownMenu::SubTrigger.new) { "Submenu" }

    expect(rendered_root_element["data-action"]).to eq("click->shadcn--menu#toggleSub")
  end

  it "keeps an explicitly supplied submenu trigger action" do
    render_inline(
      Shadcn::DropdownMenu::SubTrigger.new(data: { action: "application#open" })
    ) { "Submenu" }

    expect(rendered_root_element["data-action"]).to eq("application#open")
  end
end
