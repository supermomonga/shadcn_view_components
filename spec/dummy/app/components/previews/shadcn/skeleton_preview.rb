# frozen_string_literal: true

module Shadcn
  class SkeletonPreview < ViewComponent::Preview
    def default
      render(Shadcn::Skeleton.new(class: "h-8 w-full"))
    end
  end
end
