# typed: strict
# frozen_string_literal: true

module Shadcn
  class Spinner < BaseComponent
    # 契約タグは lucide の Loader2Icon。lucide と同等の loader-circle パスを持つ
    # インラインSVGとして描画する(アイコン系は契約に data-slot を持たない)
    sig { override.returns(String) }
    def default_tag
      "svg"
    end

    sig { override.returns(String) }
    def call
      content_tag(
        :svg,
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        width: "16",
        height: "16",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        **html_attributes
      ) do
        raw(%(<path d="M21 12a9 9 0 1 1-9-9"/>))
      end
    end
  end
end
