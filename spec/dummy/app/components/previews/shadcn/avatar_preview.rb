# frozen_string_literal: true

module Shadcn
  class AvatarPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Avatar.new) do
        render(Shadcn::Avatar::Fallback.new) { "AB" }
      end
    end

    def sizes
      safe_join(%i[sm default lg].map do |size|
        render(Shadcn::Avatar.new(size: size)) { render(Shadcn::Avatar::Fallback.new) { size.to_s } }
      end)
    end

    def group
      render(Shadcn::Avatar::Group.new) do
        safe_join([
          render(Shadcn::Avatar.new) { render(Shadcn::Avatar::Fallback.new) { "A" } },
          render(Shadcn::Avatar.new) { render(Shadcn::Avatar::Fallback.new) { "B" } },
          render(Shadcn::Avatar.new) { render(Shadcn::Avatar::Fallback.new) { "C" } }
        ])
      end
    end
  end
end
