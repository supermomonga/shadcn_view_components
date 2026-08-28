# frozen_string_literal: true

module Shadcn
  class CalendarPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Calendar.new(month: Date.new(2026, 8, 1), selected: Date.new(2026, 8, 27)))
    end

    def plain
      render(Shadcn::Calendar.new(month: Date.new(2026, 8, 1)))
    end
  end
end
