# typed: strict
# frozen_string_literal: true

module Shadcn
  # メッセージのスクロール領域(Phase 4)。一番下への追従・ボタンによる
  # スクロールは message_scroller_controller が担う
  # JS無効時フォールバック: Graceful(縦スクロールはネイティブ)
  class MessageScroller < BaseComponent
    CONTROLLER = "shadcn--message-scroller"

    sig { override.returns(T::Hash[Symbol, T.untyped]) }
    def contract_data_attributes
      super.merge(controller: CONTROLLER)
    end

    class Provider < BaseComponent
      # 状態のスコープ(div)。子をそのまま並べる
    end

    class Viewport < BaseComponent
      # div(スクロール対象)
      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        super.tap { |attributes| attributes[:tabindex] = "0" }
      end
    end

    class Content < BaseComponent
      # div
    end

    class Item < BaseComponent
      # div
    end

    class Button < BaseComponent
      # 一番下へ戻るボタン
      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:type] = "button" unless attributes.key?(:type)
        merge_nested(attributes, :data, { action: "#{CONTROLLER}#scrollToBottom" })
        attributes
      end
    end
  end
end
