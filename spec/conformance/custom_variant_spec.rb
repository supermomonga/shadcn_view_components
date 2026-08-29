# frozen_string_literal: true

# カスタムバリアント発火の静的検査(07-testing §3 の補助)。
#
# 契約や手書きコンポーネントが bare な `data-active:` 等のバリアントを使うとき、
# tailwind は対応する @custom-variant 定義が無ければ「属性の存在」マッチ
# ([data-active])へフォールバックしてコンパイルする。これは data-active のような
# bare 状態属性については正しいが、upstream が @custom-variant を定義している
# バリアント(data-horizontal → [data-orientation="horizontal"] 等)を定義無しで
# 使うと、値持ち属性に永久に不マッチになりクラスが沈黙する
# (tabs line バリアントの下線消失 — 2026-08。詳細は CHANGELOG)。
#
# 定義の供給源は npm shadcn/tailwind.css の verbatim取り込み(shadcn.css 内)なので、
# このスペックは次の2点だけを機械的に保証する:
#   1. shadcn.css が vendored tailwind.css を丸ごと含んでいる(取りこぼし・欠落の防止)
#   2. gem のクラス文字列に現れる bare data-* バリアントは「upstream 定義済み」か、
#      Base UI が bare 属性として付与するもの(presence で正しい)の許可リストに入っている。
#      どちらでもないバリアントは、@custom-variant 追加か許可リスト追加かを
#      意識的に判断させるため失敗にする
require "rails_helper"

# トークン先頭・`group-` 等の接頭辞の後・別バリアントの `:` の後に現れる
# bare な data-*: を集める(data-[...]: の属性形は対象外)
BARE_DATA_VARIANT = /(?:\A|[\s"'{}:,;-])data-([a-z][a-z-]*):/

# upstream の @custom-variant が無い bare バリアント = Base UI が bare 属性として
# 付与し、属性の存在マッチで正しく発火するもの(tabs の data-active と同型)。
# 新たに必要になったときは、コンポーネント側がその bare 属性を出していることを
# 確認してからここに加える
PRESENCE_BY_DESIGN = %w[
  autoscrolling
  empty
  ending-style
  highlighted
  instant
  inset
  nested-drawer-open
  nested-drawer-swiping
  placeholder
  popup-open
  pressed
  slot
  snap-points
  starting-style
  swiping
].freeze

RSpec.describe "custom variants used by class strings fire against the real DOM" do
  # gem が出荷するクラス文字列(生成契約 + 手書きコンポーネント)
  let(:class_sources) do
    (Dir[Rails.root.join("../../gen/contracts/*.json")] +
      Dir[Rails.root.join("../../app/components/shadcn/**/*.rb")]).sort.map { |path| File.read(path) }
  end

  let(:vendored_tailwind_css_path) do
    manifest = JSON.parse(File.read(Rails.root.join("../../vendor/shadcn/manifest.json")))
    Rails.root.join("../../vendor/shadcn/#{manifest.dig('source', 'tailwind_css', 'path')}")
  end

  let(:vendored_tailwind_css) { File.read(vendored_tailwind_css_path) }

  let(:shadcn_css) do
    File.read(Rails.root.join("../../app/assets/stylesheets/shadcn/shadcn.css"))
  end

  let(:used_bare_variants) do
    class_sources.flat_map { |source| source.scan(BARE_DATA_VARIANT).flatten }.uniq.sort
  end

  it "uses at least one bare data-* variant (scan sanity)" do
    expect(used_bare_variants).not_to be_empty
  end

  it "embeds the vendored npm shadcn/tailwind.css verbatim in shadcn.css" do
    expect(shadcn_css).to include(vendored_tailwind_css.strip),
                          "shadcn.css への tailwind.css 取り込みが欠落・部分編集されています " \
                          "(rake shadcn:generate で再生成してください)"
  end

  it "resolves every used bare data-* variant through an upstream definition or the presence allowlist" do
    upstream_defined = vendored_tailwind_css.scan(/@custom-variant data-([a-z][a-z-]*)/).flatten
    undefined = used_bare_variants.reject do |name|
      upstream_defined.include?(name) || PRESENCE_BY_DESIGN.include?(name)
    end
    expect(undefined).to be_empty,
                         "未分類の bare data-* バリアントがあります: #{undefined.join(', ')}。" \
                         "upstream が @custom-variant を定義しているバリアントは vendored tailwind.css の " \
                         "verbatim取り込みで解決されるはずで、無い場合は同期の取りこぼしです。"
  end
end
