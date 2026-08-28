# typed: strict
# frozen_string_literal: true

module Shadcn
  # Lookbook / ViewComponent プレビュー用の基底クラス。
  #
  # ViewComponent::Preview#render はコンポーネントを描画せず、
  # {args:, block:, component:, locals:, template:} からなる描画予約のディスクリプタを返す。
  # このためブロック内でネストした render の戻り値を組み合わせる記法
  # (safe_join([render(Header.new) { ... }, render(Content.new) { ... }]) 等)では
  # ディスクリプタの inspect 文字列がそのままプレビューに露出してしまう。
  #
  # この基底クラスの render は常に即座にHTML文字列を描画して返すため、
  # 単一ルート・ネスト・兄弟連結のどの記法でもそのまま組み合わせられる。
  # example の戻り値は render_args が Fragment 経由でディスクリプタに正規化する。
  # ホストアプリが独自のプレビューを書く際にも同様に利用できる。
  class PreviewBase < ViewComponent::Preview
    extend T::Sig

    # 描画済みHTML断片を1つのコンポーネントとして扱うラッパー。
    # ViewComponent::Preview のディスクリプタは最終的にビューの render 経由で
    # 描画されるため、render_in に応答するオブジェクトであればよい
    class Fragment
      extend T::Sig

      sig { params(html: T.untyped).void }
      def initialize(html:)
        super()
        @html = T.let(html, T.untyped)
      end

      # ビューの render はブロック付きで呼ぶが、断片では使わないため受けない
      sig { params(_view_context: T.untyped).returns(T.untyped) }
      def render_in(_view_context)
        @html
      end
    end

    # ViewComponent::Preview.render_args はexampleの戻り値にHashを期待するが、
    # この基底クラスのexampleはHTML文字列(SafeBuffer)を返すため、Fragment で包んで
    # ディスクリプタに正規化する。それ以外は VC の挙動(example検証・params渡し・
    # テンプレートフォールバック・layout)を踏襲する
    sig { params(example: T.any(Symbol, String), params: T.untyped).returns(T.untyped) }
    def self.render_args(example, params: {})
      example = example.to_s
      raise AbstractController::ActionNotFound, "#{example} is not a valid preview example" unless examples.include?(example)

      result = normalize_render_result(invoke_example(example, params))
      result[:template] = preview_example_template_path(example) if result[:template].nil?
      result.merge(layout: instance_variable_get(:@layout))
    end

    # example を呼び出す。宣言済みの引数名と一致するparamsだけを渡す(VCの挙動と同じ)
    sig { params(example: String, params: T.untyped).returns(T.untyped) }
    def self.invoke_example(example, params)
      example_params_names = instance_method(example).parameters.map(&:last)
      provided_params = params.slice(*example_params_names).to_h.symbolize_keys
      provided_params.empty? ? new.public_send(example) : new.public_send(example, **provided_params)
    end

    # VC標準のディスクリプタ Hash はそのまま、それ以外(HTML文字列等)は Fragment で包む
    sig { params(result: T.untyped).returns(T.untyped) }
    def self.normalize_render_result(result)
      return result if result.is_a?(Hash)

      {
        args: {},
        block: nil,
        component: Fragment.new(html: result),
        locals: {},
        template: "view_components/preview"
      }
    end

    sig { void }
    def initialize
      super
      @preview_view_context = T.let(nil, T.untyped)
    end

    private

    # example メソッドからの暗黓スコープでの呼び出しのみを想定するため private。
    # public にすると ViewComponent::Preview.examples(public_instance_methods)に
    # 「render」が載り、この基底クラス自体がプレビュー一覧に出てしまう
    #
    # rest-kwargs を持つメソッドの実行時sig検証は sorbet-runtime の既知の誤バインドがあるため
    # checked(:never) で無効化し、srb tc の静的検査に委譲する(BaseComponent と同じ運用)
    sig do
      params(component: T.untyped, args: T.untyped, block: T.nilable(T.proc.returns(T.untyped)))
        .returns(T.untyped).checked(:never)
    end
    def render(component, **args, &block)
      component.render_in(preview_view_context, **args, &block)
    end

    # コンポーネントの即時描画に使う単独のビューコンテキスト。
    # Lookbook のプレビュー出力はexampleの戻り値(HTML文字列)だけで構成されるため、
    # ルートとネストでコンテキストが分かれても出力には影響しない。
    # NOTE: 素の ActionController::Base から作るためURLヘルパー等は使えない。
    # 本gemのコンポーネントは属性の出力のみでURLヘルパーに依存しない
    sig { returns(T.untyped) }
    def preview_view_context
      @preview_view_context ||= ActionController::Base.new.view_context
    end
  end
end
