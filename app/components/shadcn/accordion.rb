# typed: strict
# frozen_string_literal: true

module Shadcn
  class Accordion < BaseComponent
    # ネイティブな details によるアコーディオン(JS無しで開閉可 — 05-stimulus-hotwire §3)。
    # JS無効時フォールバック: Graceful(開閉・排他ともネイティブ要素で成立)。
    # 単一排他は Item の name 属性で実現する(利用者が name: を渡す)。
    # 開閉アニメーション(animate-accordion-down/up)は shadcn--accordion コントローラが
    # data-state と高さ変数を同期して担う
    CONTROLLER = "shadcn--accordion"

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(controller: CONTROLLER)
    end

    class Item < BaseComponent
      # 契約タグは AccordionPrimitive.Item。ネイティブな details として描く
      sig { override.returns(String) }
      def default_tag
        "details"
      end
    end

    class Trigger < BaseComponent
      # 契約ルートは AccordionPrimitive.Trigger。JS無しで開閉するため summary 要素として
      # 描く。summary は details の直接子でなければ開閉機能しない(HTML仕様)ため、
      # upstream の Header(h3)ラッパーは省略し、見出しセマンティクスは
      # content に見出しを渡すことで表現する(summary は見出し内容を含めることができる)
      sig { override.returns(String) }
      def call
        content_tag(:summary, **trigger_attributes) do
          safe_join([content.presence, chevron_icons])
        end
      end

      private

      sig { returns(T::Hash[Symbol, T.untyped]) }
      def trigger_attributes
        attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
        merge_nested(attributes, :data, { slot: self.class.contract.const_get(:CLASSES_SLOT) })
        merge_nested(attributes, :aria, { expanded: "false" })
        attributes
      end

      # base-nova は開閉で2つのアイコンを group-aria-expanded で切り替える
      # (閉: ChevronDown / 開: ChevronUp)。両方を描き、表示は契約クラスに任せる
      sig { returns(String) }
      def chevron_icons
        icon_slots = self.class.contract.const_get(:SLOTS)
                         .select { |slot| slot[:name] == "accordion-trigger-icon" }
        safe_join(icon_slots.map do |slot|
          content_tag(:span,
                      class: slot.dig(:static_attributes, :class),
                      data: { slot: "accordion-trigger-icon" },
                      "aria-hidden": "true") { chevron_svg }
        end)
      end

      sig { returns(String) }
      def chevron_svg
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
          class: "size-4"
        ) do
          raw(%(<path d="m6 9 6 6 6-6"/>))
        end
      end
    end

    class Content < BaseComponent
      # upstream はルートに静的クラス(overflow-hidden / アニメーション)、
      # 内側のdivに契約クラス(cn)を持つ二重構造。そのまま再現する
      sig { override.returns(String) }
      def call
        attributes = @html_args.merge(class: root_static_class)
        merge_nested(attributes, :data, { slot: contract_root_slot[:name] })
        content_tag(tag, **attributes) do
          content_tag(:div, class: self.class.classes(extra: @user_class)) { content }
        end
      end

      private

      sig { returns(T.nilable(String)) }
      def root_static_class
        T.cast(contract_root_slot.dig(:static_attributes, :class), T.nilable(String))
      end
    end
  end
end
