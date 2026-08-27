# frozen_string_literal: true

module Shadcn
  class SpinnerPreview < ViewComponent::Preview
    def default
      render(Shadcn::Spinner.new)
    end

    def large
      render(Shadcn::Spinner.new(class: "size-8"))
    end
  end
end
