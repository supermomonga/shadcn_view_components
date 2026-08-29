# typed: strict
# frozen_string_literal: true

module Shadcn
  # リンクベースのページネーション(JSレス — 10-roadmap Phase 2)。
  # JS無効時フォールバック: Graceful(リンク遷移のみで完全動作)
  # Previous/Next は upstream が PaginationLink を内側で描く構成のため、
  # ルートスロットを Link から継承した契約になっている(抽出器の兄弟継承)
  class Pagination < BaseComponent
    # nav。契約の静的属性(role="navigation" / aria-label="pagination")は
    # BaseComponent#static_attribute_defaults が自動で付与する

    # Previous/Next/Ellipsis 共通のインラインSVG(lucide相当)。
    # コンポーネントクラス外のモジュールからでもヘルパが解決できるよう、必要な
    # ActionViewヘルパを明示的にincludeする(Sorbetの解決対象にもなる)
    module IconHelpers
      extend T::Sig
      include ActionView::Helpers::OutputSafetyHelper
      include ActionView::Helpers::TagHelper

      private

      sig { params(paths: String).returns(String) }
      def pagination_icon(paths)
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          width: "16",
          height: "16",
          class: "size-4",
          aria: { hidden: "true" }
        ) do
          raw(paths)
        end
      end
    end

    class Content < BaseComponent
      # ul
    end

    class Item < BaseComponent
      # li
    end

    class Link < BaseComponent
      # base-nova は Button装飾(variant/size)をrender propで<a>へ合成する。
      # 本gemもButton契約からクラスを合成して同等の<a>を描く(契約クラス自体は空)
      sig { override.returns(String) }
      def default_tag
        "a"
      end

      sig do
        params(
          is_active: T.nilable(T.any(Symbol, String, T::Boolean)),
          size: T.any(Symbol, String),
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(is_active: nil, size: :icon, **args)
        @is_active = T.let(is_active.to_s == "true", T::Boolean)
        @size = T.let(size.to_sym, Symbol)
        super(**args)
      end

      sig { returns(T::Boolean) }
      def active?
        @is_active
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        # NOTE: Hashの値型は不変のため、Classes.resolve の options と同じ型で T.let する
        button_options = T.let({ variant: active? ? :outline : :ghost, size: @size },
                               T::Hash[Symbol, T.nilable(T.any(Symbol, String))])
        attributes = @html_args.merge(
          class: ShadcnViewComponents::Classes.resolve(:button, extra: @user_class.to_s, **button_options)
        )
        merge_nested(attributes, :data, { slot: "pagination-link", active: active?.to_s })
        attributes[:aria] = { current: "page" } if active?
        attributes
      end
    end

    class Previous < BaseComponent
      include IconHelpers

      # upstream は Link(size="default")を描き、固定の子(chevron + ラベル)を足す
      sig { override.returns(String) }
      def call
        render(Link.new(size: :default, class: self.class.classes(extra: @user_class), **link_attributes)) do
          safe_join([pagination_icon(%(<path d="m15 18-6-6 6-6"/>)), default_label])
        end
      end

      private

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def link_attributes
        attributes = @html_args.dup
        aria = T.cast(attributes[:aria], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:aria] = { label: "Go to previous page" }.merge(aria)
        attributes
      end

      sig { returns(String) }
      def default_label
        content.presence || content_tag(:span, class: "hidden sm:block") { "Previous" }
      end
    end

    class Next < BaseComponent
      include IconHelpers

      sig { override.returns(String) }
      def call
        render(Link.new(size: :default, class: self.class.classes(extra: @user_class), **link_attributes)) do
          safe_join([default_label, pagination_icon(%(<path d="m9 18 6-6-6-6"/>))])
        end
      end

      private

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def link_attributes
        attributes = @html_args.dup
        aria = T.cast(attributes[:aria], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:aria] = { label: "Go to next page" }.merge(aria)
        attributes
      end

      sig { returns(String) }
      def default_label
        content.presence || content_tag(:span, class: "hidden sm:block") { "Next" }
      end
    end

    class Ellipsis < BaseComponent
      include IconHelpers

      # span(aria-hidden)。lucide の ellipsis アイコンと sr-only ラベルを含む
      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([
                      pagination_icon(%(<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>)),
                      content_tag(:span, class: "sr-only") { "More pages" }
                    ])
        end
      end
    end
  end
end
