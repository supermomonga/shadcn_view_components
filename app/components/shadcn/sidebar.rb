# typed: strict
# frozen_string_literal: true

module Shadcn
  # サイドバー(10-roadmap Phase 4 の重量級)。開閉状態は Provider の
  # data-state(open/closed)で持ち、Trigger/Rail がトグルする。
  # upstream のモバイルSheet展開・cookie永続化は本gemでは扱わない
  # (ホストが data-state をサーバ側で出力すれば良い — 05 §6 のキャッシュ方針)
  # JS無効時フォールバック: Readable(初期状態はSSRされた data-state のまま)
  class Sidebar < BaseComponent
    CONTROLLER = "shadcn--sidebar"

    sig { params(state: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
    def initialize(state: "open", **args)
      @state = T.let(state.to_s, String)
      super(**args)
    end

    # 契約スロット構成: sidebar(状態root) > sidebar-gap / sidebar-container > sidebar-inner
    sig { override.returns(String) }
    def call
      content_tag(:div, **html_attributes) do
        safe_join([gap, container])
      end
    end

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
      data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
      attributes[:data] = { slot: "sidebar", state: @state }.merge(data)
      attributes
    end

    private

    sig { returns(String) }
    def gap
      content_tag(:div, class: slot_class("sidebar-gap"), data: { slot: "sidebar-gap" }) { "".html_safe }
    end

    sig { returns(String) }
    def container
      content_tag(:div, class: slot_class("sidebar-container"), data: { slot: "sidebar-container" }) do
        content_tag(:div, class: slot_class("sidebar-inner"), data: { slot: "sidebar-inner" }) { content }
      end
    end

    sig { params(name: String).returns(T.nilable(String)) }
    def slot_class(name)
      T.cast(contract_slot(name).dig(:static_attributes, :class), T.nilable(String))
    end

    class Provider < BaseComponent
      # div(ラッパー)。data-controller を持つ状態の持ち主
      sig { params(state: T.any(Symbol, String), args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(state: "open", **args)
        @state = T.let(state.to_s, String)
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { slot: "sidebar-wrapper", controller: Sidebar::CONTROLLER, state: @state }.merge(data)
        attributes
      end
    end

    class Trigger < BaseComponent
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:type] = "button" unless attributes.key?(:type)
        merge_nested(attributes, :aria, { expanded: "true", label: "サイドバーの切替" })
        merge_nested(attributes, :data, { action: "#{Sidebar::CONTROLLER}#toggle" })
        attributes
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([panel_left_icon, content_tag(:span, class: "sr-only") { "サイドバーの切替" }])
        end
      end

      private

      sig { returns(String) }
      def panel_left_icon
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none",
          stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round",
          width: "16", height: "16", class: "size-4",
          aria: { hidden: "true" }
        ) { raw(%(<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M9 4v16"/>)) }
      end
    end

    class Rail < BaseComponent
      # 折り返し境界のつまみ(クリックでトグル)
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:type] = "button" unless attributes.key?(:type)
        attributes[:tabindex] = "-1"
        merge_nested(attributes, :aria, { label: "サイドバーの切替" })
        merge_nested(attributes, :data, { action: "#{Sidebar::CONTROLLER}#toggle" })
        attributes
      end
    end

    class Inset < BaseComponent
      # main(本体コンテンツ領域)
      sig { override.returns(String) }
      def default_tag
        "main"
      end
    end

    class Input < BaseComponent
      # upstream は Input(別アイテム)に静的クラスを足す(contains で検証)
      sig { override.returns(String) }
      def call
        render(::Shadcn::Input.new(
                 **@html_args, data: { slot: "sidebar-input", sidebar: "input" },
                               class: self.class.classes(extra: @user_class)
               )) { content }
      end
    end

    class Header < BaseComponent
      # div
    end

    class Footer < BaseComponent
      # div
    end

    class Separator < BaseComponent
      # upstream は Separator(別アイテム)に静的クラスを足す
      sig { override.returns(String) }
      def call
        render(::Shadcn::Separator.new(
                 **@html_args, data: { slot: "sidebar-separator", sidebar: "separator" },
                               class: self.class.classes(extra: @user_class)
               )) { content }
      end
    end

    class Content < BaseComponent
      # div
    end

    class Group < BaseComponent
      # div
    end

    class GroupLabel < BaseComponent
      # div
    end

    class GroupAction < BaseComponent
      # button相当(利用者が tag: a 等を渡せる)
      sig { override.returns(String) }
      def default_tag
        "button"
      end
    end

    class GroupContent < BaseComponent
      # div
    end

    class Menu < BaseComponent
      # ul
      sig { override.returns(String) }
      def default_tag
        "ul"
      end
    end

    class MenuItem < BaseComponent
      # li
      sig { override.returns(String) }
      def default_tag
        "li"
      end
    end

    class MenuButton < BaseComponent
      # variant(default/outline)× size(default/sm)のcva持ち
      sig do
        params(
          variant: T.any(Symbol, String),
          size: T.any(Symbol, String),
          active: T::Boolean,
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(variant: ShadcnViewComponents::Contracts::Sidebar::MenuButton::DEFAULTS.fetch(:variant),
                     size: ShadcnViewComponents::Contracts::Sidebar::MenuButton::DEFAULTS.fetch(:size),
                     active: false, **args)
        @variant = T.let(normalize_option(:variant, variant), Symbol)
        @size = T.let(normalize_option(:size, size), Symbol)
        @active = active
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { variant: @variant, size: @size }
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:type] = "button" unless attributes.key?(:type) || tag == "a"
        merge_nested(attributes, :data, { active: @active.to_s })
        attributes
      end
    end

    class MenuAction < BaseComponent
      # button
      sig { override.returns(String) }
      def default_tag
        "button"
      end
    end

    class MenuBadge < BaseComponent
      # div
    end

    class MenuSkeleton < BaseComponent
      # upstream は Skeleton(別アイテム)を内側に描く
      sig { params(show_icon: T::Boolean, args: T::Hash[Symbol, T.untyped]).void.checked(:never) }
      def initialize(show_icon: true, **args)
        @show_icon = show_icon
        super(**args)
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) do
          safe_join([icon_skeleton, text_skeleton])
        end
      end

      private

      # Skeleton(別アイテム)のクラスは Classes.resolve で引き、構造は自前で描く
      sig { returns(String) }
      def icon_skeleton
        return "" unless @show_icon

        skeleton_div(extra: "size-4 rounded-md")
      end

      sig { returns(String) }
      def text_skeleton
        skeleton_div(extra: "h-4 flex-1")
      end

      sig { params(extra: String).returns(String) }
      def skeleton_div(extra:)
        klass = ShadcnViewComponents::Classes.resolve(:skeleton, extra: extra)
        content_tag(:div, class: klass, data: { slot: "skeleton" }) { "".html_safe }
      end
    end

    class MenuSub < BaseComponent
      # ul
      sig { override.returns(String) }
      def default_tag
        "ul"
      end
    end

    class MenuSubItem < BaseComponent
      # li
      sig { override.returns(String) }
      def default_tag
        "li"
      end
    end

    class MenuSubButton < BaseComponent
      # a相当(tag: で差し替え可)。isActive は data-active で表現。
      # size は enum ガード(size === "sm" && ...)の露出prop
      sig do
        params(
          size: T.any(Symbol, String),
          active: T::Boolean,
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(size: ShadcnViewComponents::Contracts::Sidebar::MenuSubButton::DEFAULTS.fetch(:size),
                     active: false, **args)
        @size = T.let(normalize_option(:size, size), Symbol)
        @active = active
        super(**args)
      end

      sig { override.returns(T::Hash[Symbol, VariantOption]) }
      def variant_options
        { size: @size }
      end

      sig { override.returns(String) }
      def default_tag
        "a"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        merge_nested(attributes, :data, { active: @active.to_s })
        attributes
      end
    end
  end
end
