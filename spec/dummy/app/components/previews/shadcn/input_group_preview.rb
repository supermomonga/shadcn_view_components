# frozen_string_literal: true

module Shadcn
  class InputGroupPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::InputGroup.new(class: "max-w-xs")) do
        safe_join([
                    render(Shadcn::InputGroup::Addon.new) { "https://" },
                    render(Shadcn::InputGroup::Input.new(type: "text", placeholder: "example.com", aria: { label: "Webサイト" }))
                  ])
      end
    end
  end
end
