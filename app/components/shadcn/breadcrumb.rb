# typed: strict
# frozen_string_literal: true

module Shadcn
  class Breadcrumb < BaseComponent
    # ナビゲーション全体。JS不要・リンクベース(05-stimulus-hotwire §6.4)
    class List < BaseComponent; end

    class Item < BaseComponent; end

    class Link < BaseComponent; end

    class Page < BaseComponent; end

    # 区切り記号。子コンテンツが無ければ chevron アイコン(lucideと同等のパス)を描画する
    class Separator < BaseComponent
      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) { content.presence || chevron_icon }
      end

      private

      sig { returns(String) }
      def chevron_icon
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        ) do
          raw(%(<path d="m9 18 6-6-6-6"/>))
        end
      end
    end

    # 省略記号(…)。lucide と同等のパス + スクリーンリーダー向けラベル
    class Ellipsis < BaseComponent
      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([
                      content_tag(
                        :svg,
                        xmlns: "http://www.w3.org/2000/svg",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        "stroke-width": "2",
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        class: "size-4"
                      ) do
                        raw(%(<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>))
                      end,
                      content_tag(:span, "More", class: "sr-only")
                    ])
        end
      end
    end
  end
end
