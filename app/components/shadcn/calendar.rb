# typed: strict
# frozen_string_literal: true

module Shadcn
  # 月表示カレンダー(10-roadmap Phase 4 の個別評価ルート)。
  # upstream は react-day-picker を使うが、本gemは依存せず月テーブルを
  # サーバ側で描く(見出し・曜日・日付ボタン)。年月の移動は GET リンクの
  # サーバラウンドトリップで行う(完全JSレス — 05 §5 Graceful)
  #
  # 契約クラスは lib/shadcn_view_components/contracts/calendar.rb に
  # 手動で保守する(静的抽出の対象外のため再生成されない点に注意)
  class Calendar < BaseComponent
    START_OF_WEEK = 0 # 日曜始まり
    WEEKDAY_LABELS = %w[日 月 火 水 木 金 土].freeze

    sig do
      params(
        month: Date,
        selected: T.nilable(Date),
        month_path: T.nilable(String),
        args: T::Hash[Symbol, T.untyped]
      ).void.checked(:never)
    end
    def initialize(month: Date.current.beginning_of_month, selected: nil, month_path: nil, **args)
      @month = month
      @selected = selected
      # 年月移動リンクの送り先(例: pages_calendar_path)。未指定の時はリンクを出さない
      @month_path = month_path
      super(**args)
    end

    sig { override.returns(String) }
    def call
      content_tag(:div, **html_attributes) do
        # ナビはキャプション行に絶対配置で重なる(upstream rdp と同じ構造)
        safe_join([render(Navigation.new(month: @month, month_path: @month_path)), month_grid])
      end
    end

    # キャプション行 + 前後月ボタン群。ボタン群はキャプション行の上に絶対配置する
    # (month_path が与えられたときのみリンクになる)
    class Navigation < BaseComponent
      sig do
        params(
          month: Date,
          month_path: T.nilable(String),
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(month:, month_path: nil, **args)
        @month = month
        @month_path = month_path
        super(**args)
      end

      sig { override.returns(String) }
      def call
        safe_join([caption_row, nav_buttons])
      end

      private

      # 月タイトルの行(upstream month_caption 相当)
      sig { returns(String) }
      def caption_row
        row_class = "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size) font-medium select-none text-sm"
        content_tag(:div, class: row_class) { "#{@month.year}年#{@month.month}月" }
      end

      sig { returns(String) }
      def nav_buttons
        content_tag(:div, class: "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1") do
          safe_join([
                      nav_link(direction: :previous, label: "前の月") { chevron(:left) },
                      nav_link(direction: :next, label: "次の月") { chevron(:right) }
                    ])
        end
      end

      sig { params(direction: Symbol, label: String, block: T.proc.returns(String)).returns(String) }
      def nav_link(direction:, label:, &block)
        target = direction == :previous ? @month.prev_month : @month.next_month
        content_tag(:a,
                    href: "#{@month_path}?month=#{target.strftime('%Y-%m')}",
                    class: "inline-flex items-center justify-center rounded-lg size-(--cell-size) p-0 select-none " \
                           "hover:bg-muted hover:text-foreground outline-none aria-disabled:opacity-50",
                    aria: { label: label }) { block.call }
      end

      sig { params(direction: Symbol).returns(String) }
      def chevron(direction)
        path = direction == :left ? %(<path d="m15 18-6-6 6-6"/>) : %(<path d="m9 18 6-6-6-6"/>)
        content_tag(
          :svg,
          xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none",
          stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round",
          width: "16", height: "16", class: "size-4",
          aria: { hidden: "true" }
        ) { raw(path) }
      end
    end

    class DayButton < BaseComponent
      # 1日分のボタン(契約クラスは手動契約モジュールを参照)
      sig do
        params(
          date: Date,
          selected: T::Boolean,
          outside: T::Boolean,
          today: T::Boolean,
          args: T::Hash[Symbol, T.untyped]
        ).void.checked(:never)
      end
      def initialize(date: Date.current, selected: false, outside: false, today: false, **args)
        @date = date
        @selected = selected
        @outside = outside
        @today = today
        super(**args)
      end

      sig { override.returns(String) }
      def default_tag
        "button"
      end

      sig { override.returns(T::Hash[Symbol, T.untyped]) }
      def html_attributes
        attributes = super
        attributes[:type] = "button"
        attributes[:tabindex] = "-1" if @outside
        merge_nested(attributes, :data, {
                       day: @date.iso8601,
                       selected_single: @selected.to_s,
                       today: @today.to_s,
                       outside: @outside.to_s
                     })
        attributes
      end

      sig { override.returns(String) }
      def call
        content_tag(tag, **html_attributes) { @date.day.to_s }
      end
    end

    private

    sig { returns(T::Hash[Symbol, T.untyped]) }
    def html_attributes
      # flex コンテナ化(契約クラスの冒頭)は重要: block のままだと内側 table
      # (width:100%)の自然幅が利用幅に解決されて w-fit が効かなくなる
      attributes = @html_args.merge(class: self.class.classes(extra: @user_class))
      data = T.cast(attributes[:data], T.nilable(T::Hash[Symbol, T.untyped])) || {}
      attributes[:data] = { slot: "calendar" }.merge(data)
      attributes
    end

    sig { returns(String) }
    def month_grid
      # 幅は 7×(--cell-size)(= spacing 7 × 7 = w-49)に固定する(upstream rdp の
      # month_grid と同じ 196px)。w-full / w-fit の親子で幅を決めると Chrome の
      # table 自然幅計算が利用幅に解決され、セルが --cell-size より広がり、
      # upstream と寸法が合わなくなる
      content_tag(:table, class: "w-49 border-collapse") do
        safe_join([weekday_header, weeks_body])
      end
    end

    sig { returns(String) }
    def weekday_header
      content_tag(:thead) do
        content_tag(:tr, class: "flex") do
          safe_join(WEEKDAY_LABELS.map do |label|
            content_tag(:th,
                        class: "flex-1 rounded-md text-[0.8rem] font-normal text-muted-foreground select-none",
                        scope: "col", abbr: label) { label }
          end)
        end
      end
    end

    sig { returns(String) }
    def weeks_body
      content_tag(:tbody) do
        safe_join(month_weeks.map do |week|
          content_tag(:tr, class: "mt-2 flex w-full") do
            safe_join(week.map { |date| day_cell(date) })
          end
        end)
      end
    end

    # 月を週(日曜始まり)ごとに分割する。前月末尾・翌月先頭は outside 扱いで補完する
    sig { returns(T::Array[T::Array[Date]]) }
    def month_weeks
      first = @month.beginning_of_month
      last = @month.end_of_month
      start_date = first - ((first.wday - START_OF_WEEK) % 7)
      end_date = last + ((START_OF_WEEK - 1 - last.wday) % 7)
      (start_date..end_date).each_slice(7).to_a
    end

    sig { params(date: Date).returns(String) }
    def day_cell(date)
      today = date == Date.current
      outside = date.month != @month.month
      # w-full を付けない: td が table 幅の 100% を要求すると 7列分の割合指定で
      # table 幅が利用幅まで引き延ばされてセルが --cell-size より広くなる
      cell_class = +"group/day relative aspect-square h-full p-0 text-center select-none " \
                    "[&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius) " \
                    "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)"
      cell_class << " rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none" if today
      cell_class << " text-muted-foreground aria-selected:text-muted-foreground" if outside

      content_tag(:td, class: cell_class, data: { today: today.to_s, outside: outside.to_s }) do
        render(DayButton.new(
                 date: date,
                 selected: date == @selected,
                 outside: outside,
                 today: today
               ))
      end
    end

    private_constant :Navigation
  end
end
