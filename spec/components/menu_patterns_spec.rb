# frozen_string_literal: true

require "rails_helper"

RSpec.describe "menu component patterns", type: :component do
  it "renders DropdownMenu as an ARIA menu controlled by shadcn--menu" do
    render_inline(Shadcn::DropdownMenu.new)
    expect(rendered_root_element["data-controller"]).to eq("shadcn--menu")

    render_inline(Shadcn::DropdownMenu::Trigger.new) { "Open" }
    expect(rendered_root_element.name).to eq("button")
    expect(rendered_root_element["aria-haspopup"]).to eq("menu")
    expect(rendered_root_element["data-action"]).to eq("shadcn--menu#toggle")

    render_inline(Shadcn::DropdownMenu::Content.new)
    expect(rendered_root_element["role"]).to eq("menu")
    expect(rendered_root_element["popover"]).to eq("auto")
  end

  it "renders ContextMenu with a generic right-click trigger and no left-click action" do
    render_inline(Shadcn::ContextMenu::Trigger.new) { "Area" }

    expect(rendered_root_element.name).to eq("div")
    expect(rendered_root_element["type"]).to be_nil
    expect(rendered_root_element["tabindex"]).to eq("0")
    expect(rendered_root_element["aria-haspopup"]).to eq("menu")
    expect(rendered_root_element["aria-expanded"]).to be_nil
    expect(rendered_root_element["data-action"]).to eq("contextmenu->shadcn--menu#showAt")

    render_inline(Shadcn::ContextMenu::Content.new)
    expect(rendered_root_element["popover"]).to eq("manual")
  end

  it "renders Menubar with its own controller and menubar semantics" do
    render_inline(Shadcn::Menubar.new)
    expect(rendered_root_element["data-controller"]).to eq("shadcn--menubar")
    expect(rendered_root_element["role"]).to eq("menubar")
    expect(rendered_root_element["aria-orientation"]).to eq("horizontal")

    render_inline(Shadcn::Menubar::Menu.new)
    expect(rendered_root_element["role"]).to eq("none")

    render_inline(Shadcn::Menubar::Trigger.new) { "File" }
    expect(rendered_root_element["role"]).to eq("menuitem")
    expect(rendered_root_element["data-action"]).to eq("shadcn--menubar#toggle")

    render_inline(Shadcn::Menubar::Item.new) { "New" }
    expect(rendered_root_element["data-action"]).to eq("shadcn--menubar#activate")

    render_inline(Shadcn::Menubar::SubTrigger.new) { "Recent" }
    expect(rendered_root_element["data-action"]).to eq("click->shadcn--menubar#toggleSub")
  end

  it "renders NavigationMenu as native navigation rather than an ARIA menu" do
    render_inline(Shadcn::NavigationMenu.new)
    expect(rendered_root_element.name).to eq("nav")
    expect(rendered_root_element["data-controller"]).to eq("shadcn--navigation-menu")

    render_inline(Shadcn::NavigationMenu::Trigger.new) { "Docs" }
    expect(rendered_root_element["aria-haspopup"]).to be_nil
    expect(rendered_root_element["aria-expanded"]).to eq("false")
    expect(rendered_root_element["data-action"]).to eq("shadcn--navigation-menu#toggle")

    render_inline(Shadcn::NavigationMenu::Content.new)
    expect(rendered_root_element.name).to eq("div")
    expect(rendered_root_element["role"]).to be_nil
    expect(rendered_root_element["popover"]).to eq("auto")

    render_inline(Shadcn::NavigationMenu::Link.new(href: "/docs")) { "Docs" }
    expect(rendered_root_element.name).to eq("a")
    expect(rendered_root_element["role"]).to be_nil
  end
end
