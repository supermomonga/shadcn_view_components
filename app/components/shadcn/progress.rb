# typed: strict
# frozen_string_literal: true

module Shadcn
  # 進捗バー。role=progressbar と aria 値をネイティブARIAで表現する
  class Progress < BaseComponent
    sig do
      params(
        value: T.nilable(T.any(Integer, Float, String)),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(value: self.class.property_default(:value), **args)
      @value = T.let(normalize_property(:value, value), T.nilable(T.any(Integer, Float)))
      super(**args)
    end

    sig { override.returns(String) }
    def call
      content_tag(tag, **html_attributes) do
        safe_join([content, progress_track])
      end
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = super
      attributes[:role] = "progressbar"
      aria_defaults = T.let({ valuemin: "0", valuemax: "100" }, T::Hash[Symbol, T.untyped])
      aria_defaults[:valuenow] = @value.to_s if @value
      merge_nested(attributes, :aria, aria_defaults)
      attributes
    end

    private

    sig { returns(String) }
    def progress_track
      content_tag(:div, class: ShadcnViewComponents::Classes.resolve(:progress_track), data: { slot: "progress-track" }) do
        content_tag(
          :div,
          class: ShadcnViewComponents::Classes.resolve(:progress_indicator),
          style: "width: #{@value || 0}%",
          data: { slot: "progress-indicator" }
        ) { "".html_safe }
      end
    end
  end
end
