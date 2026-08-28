# typed: strict
# frozen_string_literal: true

module Shadcn
  # トースト(Phase 4)。upstream は sonner ライブラリを使うが、本gemは
  # Stimulus + CustomEvent で同等の通知領域を提供する:
  #   dispatchEvent(new CustomEvent("shadcn:toast", { detail: { title: "保存しました" } }))
  # JS無効時フォールバック: Graceful(通知はJS依存だが、領域自体は空で害がない)
  class Sonner < BaseComponent
    class Toaster < BaseComponent
      CONTROLLER = "shadcn--toast"

      sig { override.returns(String) }
      def default_tag
        "section"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        static_class = T.cast(contract_slot("").dig(:static_attributes, :class), T.nilable(String))
        attributes = @html_args.merge(class: [static_class, @user_class].compact.join(" "))
        data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
        attributes[:data] = { controller: CONTROLLER }.merge(data)
        merge_nested(attributes, :aria, { live: "polite" })
        attributes
      end
    end
  end
end
