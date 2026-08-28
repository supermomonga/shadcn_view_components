# typed: strict
# frozen_string_literal: true

module Shadcn
  # グラフ(Phase 4)。upstream は recharts を使うが、本gemは
  # 「容器と凡例・ツールチップの構造」のみを提供し、描画はホストが
  # 好きなライブラリ(Chart.js 等)で行う設計(10-roadmap Phase 4 の個別評価)
  # JS無効時フォールバック: Graceful(容器・凡例はSSR済み)
  class Chart < BaseComponent
    class Container < BaseComponent
      # 契約スロット構成: 名前無しラッパー > chart(描画領域)
      sig { override.returns(String) }
      def call
        content_tag(:div, **html_attributes) do
          content_tag(:div, class: self.class.classes(extra: @user_class), data: { slot: "chart" }) { content }
        end
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = @html_args.dup
        attributes[:class] = T.cast(contract_slot("").dig(:static_attributes, :class), T.nilable(String))
        attributes
      end
    end

    class Tooltip < BaseComponent
      # ツールチップのコンテナ(recharts の Tooltip 相当の位置決めはホスト側)
    end

    class TooltipContent < BaseComponent
      # ツールチップ本体(契約クラスのみ。中身は利用者が組む)
      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) { content }
      end
    end

    class Legend < BaseComponent
      # 凡例コンテナ
    end

    class LegendContent < BaseComponent
      # 凡例本体(契約クラスのみ)
      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) { content }
      end
    end

    class Style < BaseComponent
      # グラフ用のCSSを <style> として出力する(upstream と同じ役割)
      sig { override.returns(String) }
      def default_tag
        "style"
      end

      sig { override.returns(String) }
      def call
        content_tag(:style) { content.to_s }
      end
    end
  end
end
