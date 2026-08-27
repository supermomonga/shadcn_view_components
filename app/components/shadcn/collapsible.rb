# typed: strict
# frozen_string_literal: true

module Shadcn
  class Collapsible < BaseComponent
    # ネイティブな details(JS無しで開閉可 — 05-stimulus-hotwire §3)
    # JS無効時フォールバック: Graceful(ネイティブ要素で成立)
    sig { override.returns(String) }
    def default_tag
      "details"
    end

    class Trigger < BaseComponent
      # JS無しで開閉するため trigger は summary 要素
      sig { override.returns(String) }
      def default_tag
        "summary"
      end
    end

    class Content < BaseComponent
      # details の子として開閉時に表示される。契約クラスはそのまま適用
    end
  end
end
