# frozen_string_literal: true

module Shadcn
  class NativeSelectPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::NativeSelect.new(name: "fruit", aria: { label: "果物" })) do
        safe_join([
                    render(Shadcn::NativeSelect::Option.new(value: "apple")) { "りんご" },
                    render(Shadcn::NativeSelect::Option.new(value: "banana")) { "バナナ" }
                  ])
      end
    end
  end
end
