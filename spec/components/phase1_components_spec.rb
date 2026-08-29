# frozen_string_literal: true

# Phase 1 コンポーネントのAPIスペック(層1 — 07-testing §4)。
# クラス列・data-slot の一致は適合試験(層2)が担保するため、
# ここではRuby APIのふるまい(組み合わせ・差し替え・void要素)に絞る
require "rails_helper"

# テスト専用の組み合わせラッパー(render_inlineに渡すブロックはspecコンテキストで
# 評価されるため、組み合わせexampleはラッパーコンポーネント経由で描画する)
class CardComposition < ViewComponent::Base
  # NOTE: 純Rubyの#call内ではブロックの戻り値のみが使われるため safe_join で連結する
  # (ERBテンプレート内では出力バッファに連結されるためこの制約は無い)
  def call
    render(Shadcn::Card.new) do
      safe_join([
                  render(Shadcn::Card::Header.new) do
                    safe_join([
                                render(Shadcn::Card::Title.new) { "タイトル" },
                                render(Shadcn::Card::Description.new) { "説明" }
                              ])
                  end,
                  render(Shadcn::Card::Content.new) { "本文" },
                  render(Shadcn::Card::Footer.new) { "フッター" }
                ])
    end
  end
end

class TableComposition < ViewComponent::Base
  def call
    render(Shadcn::Table.new) do
      safe_join([
                  render(Shadcn::Table::Header.new) do
                    render(Shadcn::Table::Row.new) do
                      render(Shadcn::Table::Head.new) { "見出し" }
                    end
                  end,
                  render(Shadcn::Table::Body.new) do
                    render(Shadcn::Table::Row.new) do
                      render(Shadcn::Table::Cell.new) { "セル" }
                    end
                  end
                ])
    end
  end
end

class AvatarComposition < ViewComponent::Base
  def call
    render(Shadcn::Avatar.new(size: :lg)) do
      safe_join([
                  render(Shadcn::Avatar::Image.new(src: "a.png", alt: "A")),
                  render(Shadcn::Avatar::Fallback.new) { "AB" }
                ])
    end
  end
end

class BreadcrumbComposition < ViewComponent::Base
  def call
    render(Shadcn::Breadcrumb.new) do
      render(Shadcn::Breadcrumb::List.new) do
        safe_join([
                    render(Shadcn::Breadcrumb::Item.new) do
                      render(Shadcn::Breadcrumb::Link.new(href: "/")) { "Home" }
                    end,
                    render(Shadcn::Breadcrumb::Item.new) do
                      render(Shadcn::Breadcrumb::Ellipsis.new)
                    end,
                    render(Shadcn::Breadcrumb::Item.new) do
                      render(Shadcn::Breadcrumb::Page.new) { "現在" }
                    end
                  ])
      end
    end
  end
end

RSpec.describe "Phase 1 display components", type: :component do
  describe Shadcn::Badge do
    it "renders a span with the variant classes and data-variant" do
      render_inline(described_class.new(variant: :outline)) { "Badge" }

      expect(rendered_root_element.name).to eq("span")
      expect(rendered_root_element["data-variant"]).to eq("outline")
      expect(rendered_root_element["class"]).to eq(described_class.classes(variant: :outline))
    end

    it "raises ArgumentError for an unknown variant" do
      expect { described_class.new(variant: :nope) }.to raise_error(ArgumentError, /unknown variant value/)
    end
  end

  describe Shadcn::Card do
    it "composes nested parts with their own contract classes" do
      render_inline(CardComposition.new)

      slots = rendered_fragment.css("[data-slot]").map { |node| node["data-slot"] }
      expect(slots).to eq(%w[card card-header card-title card-description card-content card-footer])
      expect(rendered_fragment.css("[data-slot='card-title']").first["class"])
        .to eq(Shadcn::Card::Title.classes)
    end
  end

  describe Shadcn::Table do
    it "wraps the table element in the overflow container" do
      render_inline(TableComposition.new)

      container = rendered_fragment.css("[data-slot='table-container']").first
      table = rendered_fragment.css("[data-slot='table']").first
      expect(container["class"]).to eq("relative w-full overflow-x-auto")
      expect(table.name).to eq("table")
      expect(table["class"]).to eq(Shadcn::Table.classes)
    end
  end

  describe Shadcn::Input do
    it "renders a void input element without a closing tag" do
      render_inline(described_class.new(type: :email, placeholder: "email"))

      element = rendered_fragment.at_xpath("./*[1]")
      expect(element.name).to eq("input")
      expect(element["type"]).to eq("email")
      expect(rendered_content).not_to include("</input>")
    end
  end

  describe Shadcn::Separator do
    it "renders a native divider with orientation attributes" do
      render_inline(described_class.new(orientation: :vertical))

      expect(rendered_root_element.name).to eq("div")
      expect(rendered_root_element["role"]).to eq("separator")
      expect(rendered_root_element["data-orientation"]).to eq("vertical")
      expect(rendered_root_element["aria-orientation"]).to eq("vertical")
    end
  end

  describe Shadcn::Spinner do
    it "renders an inline SVG spinner with data-slot" do
      render_inline(described_class.new)

      element = rendered_fragment.at_xpath("./*[1]")
      expect(element.name).to eq("svg")
      expect(element["role"]).to eq("status")
      expect(element["aria-label"]).to eq("Loading")
      expect(element["data-slot"]).to eq("spinner")
      expect(rendered_fragment.css("path").length).to eq(1)
    end
  end

  describe Shadcn::Avatar do
    it "renders image and fallback parts" do
      render_inline(AvatarComposition.new)

      expect(rendered_fragment.css("[data-slot='avatar']").first["data-size"]).to eq("lg")
      image = rendered_fragment.css("[data-slot='avatar-image']").first
      expect(image.name).to eq("img")
      expect(image["src"]).to eq("a.png")
      expect(rendered_fragment.css("[data-slot='avatar-fallback']").first.text).to eq("AB")
    end
  end

  describe Shadcn::Breadcrumb do
    it "renders a nav breadcrumb with separators and ellipsis" do
      render_inline(BreadcrumbComposition.new)

      expect(rendered_fragment.css("nav[aria-label='breadcrumb']").length).to eq(1)
      expect(rendered_fragment.css("[data-slot='breadcrumb-link']").first.name).to eq("a")
      expect(rendered_fragment.css("[data-slot='breadcrumb-ellipsis'] svg").length).to eq(1)
      expect(rendered_fragment.css("[data-slot='breadcrumb-page']").first["aria-current"]).to eq("page")
    end
  end
end
