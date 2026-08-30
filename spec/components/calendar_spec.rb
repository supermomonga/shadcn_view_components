# frozen_string_literal: true

require "rails_helper"

RSpec.describe Shadcn::Calendar, type: :component do
  include ActiveSupport::Testing::TimeHelpers

  around do |example|
    travel_to(Time.zone.local(2026, 8, 30, 12)) { example.run }
  end

  it "renders labelled grid state, complete day names, and one roving tab stop" do
    render_inline(described_class.new(month: Date.new(2026, 8, 1), selected: Date.new(2026, 8, 27)))

    root = rendered_root_element
    expect(root["id"]).to match(/\Ashadcn-calendar-[0-9a-f]{24}\z/)
    expect(root["data-shadcn-generated-root-id"]).to eq("true")
    expect(root["data-controller"]).to eq("shadcn--calendar")
    expect(root["data-action"]).to eq("keydown->shadcn--calendar#navigate")

    caption = root.at_css("[data-slot='calendar-caption']")
    grid = root.at_css("[data-slot='calendar-grid'][role='grid']")
    expect(grid["aria-labelledby"]).to eq(caption["id"])

    selected = root.at_css("[role='gridcell'][aria-selected='true']")
    selected_button = selected.at_css("[data-day='2026-08-27']")
    expect(selected_button["aria-label"]).to eq("2026年8月27日")
    expect(selected_button["tabindex"]).to eq("0")

    today = root.at_css("[data-day='2026-08-30']")
    expect(today["aria-current"]).to eq("date")
    expect(today["aria-label"]).to eq("2026年8月30日")
    expect(today["tabindex"]).to eq("-1")
    expect(root.css("[data-slot='calendar-day-button'][tabindex='0']").length).to eq(1)
    expect(root.css("[role='gridcell'][aria-selected='false']").length).to eq(41)
  end

  it "preserves a user root ID and day-button ARIA overrides" do
    render_inline(described_class.new(id: "booking-calendar", month: Date.new(2026, 8, 1)))

    expect(rendered_root_element["id"]).to eq("booking-calendar")
    expect(rendered_root_element).not_to have_attribute("data-shadcn-generated-root-id")

    render_inline(Shadcn::Calendar::DayButton.new(
                    date: Date.new(2026, 8, 30),
                    today: true,
                    aria: { label: "予約日", current: "step" }
                  ))
    expect(rendered_root_element["aria-label"]).to eq("予約日")
    expect(rendered_root_element["aria-current"]).to eq("step")
  end

  it "keeps outside days out of the default tab order without replacing an explicit tabindex" do
    render_inline(Shadcn::Calendar::DayButton.new(date: Date.new(2026, 7, 26), outside: true))
    expect(rendered_root_element["tabindex"]).to eq("-1")

    render_inline(Shadcn::Calendar::DayButton.new(
                    date: Date.new(2026, 7, 26),
                    outside: true,
                    tabindex: "0"
                  ))
    expect(rendered_root_element["tabindex"]).to eq("0")
  end
end
