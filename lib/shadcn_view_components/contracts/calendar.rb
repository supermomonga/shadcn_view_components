# typed: strict
# frozen_string_literal: true

# calendar の個別契約(10-roadmap Phase 4 の個別評価ルート)。
# upstream は react-day-picker の classNames 実行時合成(cn(defaultClassNames.*)
# や String.raw)を行うため静的抽出の対象外。クラス文字列は tools/extractor と
# 同一の cva + tailwind-merge で事前解決した値を手動で保守する。
# upstream 再取得時はこの値の再計算が必要(rake shadcn:generate の対象外である点に注意)
module ShadcnViewComponents
  module Contracts
    module Calendar
      ROOT_SLOT = T.let("calendar", String)

      DEFAULTS = T.let({}.freeze, T::Hash[Symbol, Symbol])

      VARIANTS = T.let({}.freeze, T::Hash[Symbol, T::Array[Symbol]])

      COMBINATIONS = T.let({
        {} => "group/calendar bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] " \
              "in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent w-fit"
      }.freeze, T::Hash[T::Hash[Symbol, Symbol], String])

      SLOTS = T.let([
        {
          name: "calendar",
          tag: "div",
          static_attributes: {}.freeze,
          dynamic_attributes: [].freeze
        }.freeze
      ].freeze, T::Array[T::Hash[Symbol, T.untyped]])

      extend T::Sig

      sig { params(options: T::Hash[Symbol, Symbol]).returns(String) }
      module_function def combination(options)
        COMBINATIONS.fetch(options)
      end

      module DayButton
        ROOT_SLOT = T.let("calendar-day-button", String)

        DEFAULTS = T.let({}.freeze, T::Hash[Symbol, Symbol])

        VARIANTS = T.let({}.freeze, T::Hash[Symbol, T::Array[Symbol]])

        COMBINATIONS = T.let({
          {} => "group/button shrink-0 items-center justify-center rounded-lg border-transparent bg-clip-padding " \
                "text-sm whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring " \
                "focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px " \
                "disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive " \
                "aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 " \
                "dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 " \
                "[&_svg:not([class*='size-'])]:size-4 hover:bg-muted hover:text-foreground " \
                "aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 px-2.5 " \
                "has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 relative isolate z-10 flex " \
                "aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none " \
                "font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 " \
                "group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] " \
                "group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) " \
                "data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary " \
                "data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none " \
                "data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground " \
                "data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) " \
                "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground " \
                "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground " \
                "dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70"
        }.freeze, T::Hash[T::Hash[Symbol, Symbol], String])

        SLOTS = T.let([
          {
            name: "calendar-day-button",
            tag: "button",
            static_attributes: {}.freeze,
            dynamic_attributes: [].freeze
          }.freeze
        ].freeze, T::Array[T::Hash[Symbol, T.untyped]])

        extend T::Sig

        sig { params(options: T::Hash[Symbol, Symbol]).returns(String) }
        module_function def combination(options)
          COMBINATIONS.fetch(options)
        end
      end
    end
  end
end
