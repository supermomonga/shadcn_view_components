# frozen_string_literal: true

require "rails_helper"

RSpec.describe Shadcn::InputOTP, type: :component do
  it "renders the native input and a server-rendered slot for every character" do
    render_inline(described_class.new(length: 4, value: "12"))

    container = rendered_fragment.at_css("[data-input-otp-container]")
    input = container.at_css("input[data-slot='input-otp']")
    display = container.at_css("[data-input-otp-display]")
    slots = display.css("[data-slot='input-otp-slot']")

    expect(container["data-controller"]).to eq("shadcn--input-otp")
    expect(container["class"].split).to include(
      "cn-input-otp",
      "flex",
      "items-center",
      "has-disabled:opacity-50"
    )
    expect(display["aria-hidden"]).to eq("true")
    expect(display.at_css("[data-slot='input-otp-group']")).not_to be_nil
    expect(slots.map { |slot| slot["data-index"] }).to eq(%w[0 1 2 3])
    expect(slots.map { |slot| slot.at_css("[data-slot='input-otp-character']").text }).to eq(["1", "2", "", ""])
    expect(slots.map { |slot| slot["data-active"] }).to all(eq("false"))
    expect(slots.map { |slot| slot.at_css("[data-slot='input-otp-caret'][hidden]") }).to all(be_present)

    expect(input.attributes.transform_values(&:value)).to include(
      "type" => "text",
      "inputmode" => "numeric",
      "maxlength" => "4",
      "autocomplete" => "one-time-code",
      "spellcheck" => "false",
      "value" => "12"
    )
    expect(input["style"]).to include(
      "position: absolute",
      "color: transparent",
      "pointer-events: all",
      "caret-color: transparent"
    )
  end

  it "fixes the native control to text and truncates its server-rendered value to length" do
    render_inline(described_class.new(length: 4, value: "12345", type: "email"))

    input = rendered_fragment.at_css("input[data-slot='input-otp']")
    characters = rendered_fragment.css("[data-slot='input-otp-character']")

    expect(input.attributes.transform_values(&:value)).to include(
      "type" => "text",
      "maxlength" => "4",
      "value" => "1234"
    )
    expect(characters.map(&:text)).to eq(%w[1 2 3 4])
  end

  it "routes all form and accessible input attributes to the real input" do
    render_inline(described_class.new(
                    length: 6,
                    value: "A12",
                    container_class: "max-w-sm",
                    id: "otp",
                    name: "session[otp]",
                    form: "sign-in",
                    required: true,
                    disabled: true,
                    inputmode: "text",
                    pattern: "[A-Z0-9]*",
                    aria: { label: "確認コード", describedby: "otp-error", invalid: "true" },
                    class: "tracking-widest",
                    style: "text-align: center",
                    data: { testid: "otp-control", action: "input->preview#record" },
                    onblur: "window.otpBlurred = true"
                  ))

    container = rendered_fragment.at_css("[data-input-otp-container]")
    input = container.at_css("input[data-slot='input-otp']")

    expect(container["class"].split).to include("max-w-sm")
    expect(container.attributes.transform_values(&:value)).not_to include(
      "id" => "otp",
      "name" => "session[otp]",
      "form" => "sign-in",
      "aria-label" => "確認コード"
    )
    expect(input.attributes.transform_values(&:value)).to include(
      "id" => "otp",
      "name" => "session[otp]",
      "form" => "sign-in",
      "required" => "required",
      "disabled" => "disabled",
      "inputmode" => "text",
      "pattern" => "[A-Z0-9]*",
      "aria-label" => "確認コード",
      "aria-describedby" => "otp-error",
      "aria-invalid" => "true",
      "data-testid" => "otp-control",
      "onblur" => "window.otpBlurred = true"
    )
    expect(input["class"].split).to include("disabled:cursor-not-allowed", "tracking-widest")
    expect(input["style"]).to end_with("text-align: center")
    expect(input["data-action"]).to end_with("input->preview#record")
    expect(container.at_css("[data-input-otp-display]")).to have_attribute("data-disabled")
    expect(container.at_css("[data-input-otp-display]")).to have_attribute("data-invalid")
    expect(container.css("[data-slot='input-otp-slot']").map { |slot| slot["aria-invalid"] }).to all(eq("true"))
  end

  it "uses explicit block content instead of adding the standard group" do
    render_inline(described_class.new(length: 4, value: "1234")) do
      '<div data-custom-layout="true">Custom layout</div>'.html_safe
    end

    display = rendered_fragment.at_css("[data-input-otp-display]")
    expect(display.at_css("[data-custom-layout='true']")&.text).to eq("Custom layout")
    expect(display.at_css("[data-slot='input-otp-group']")).to be_nil
    expect(rendered_fragment.at_css("input[data-slot='input-otp'][value='1234']")).not_to be_nil
  end

  it "renders the upstream no-script fallback for a usable native input" do
    render_inline(described_class.new)

    expect(rendered_content).to include(
      "<noscript>",
      "[data-input-otp]",
      "color: var(--nojs-fg) !important",
      "caret-color: var(--nojs-fg) !important",
      "border: 1px solid var(--nojs-fg) !important"
    )
  end

  describe Shadcn::InputOTP::Slot do
    it "renders a character span and the hidden two-layer fake caret" do
      render_inline(described_class.new(index: 2)) { "7" }

      expect(rendered_root_element.attributes.transform_values(&:value)).to include(
        "data-slot" => "input-otp-slot",
        "data-index" => "2",
        "data-active" => "false"
      )
      expect(rendered_root_element.at_css("[data-slot='input-otp-character']").text).to eq("7")

      caret = rendered_root_element.at_css("[data-slot='input-otp-caret']")
      expect(caret).to have_attribute("hidden")
      expect(caret["class"].split).to include("pointer-events-none", "absolute", "inset-0")
      expect(caret.element_children.one?).to be(true)
      expect(caret.element_children.first["class"].split).to include(
        "h-4",
        "w-px",
        "animate-caret-blink",
        "bg-foreground",
        "duration-1000"
      )
    end
  end

  describe Shadcn::InputOTP::Separator do
    it "renders the Lucide Minus icon" do
      render_inline(described_class.new)

      expect(rendered_root_element["role"]).to eq("separator")
      expect(rendered_root_element.at_css("svg[aria-hidden='true'] path[d='M5 12h14']")).not_to be_nil
    end
  end
end
