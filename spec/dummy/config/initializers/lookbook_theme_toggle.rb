# frozen_string_literal: true

# Lookbook プレビューツールバーの display option「theme」(light/dark)を
# セレクトではなくトグルボタンで表示するためのテンプレート差し替え
# (spec/dummy/app/components/lookbook/display_options/field/component.html.erb)。
#
# ViewComponent 4 はコンポーネントのテンプレートをクラス定義ファイルの隣
# (sidecar)からしか解決しないため、アプリ側に同配置テンプレートを置いても
# 無視される。そこで Field::Component.sidecar_files を差し替え、dummy 側の
# テンプレートだけを返すようにしている。
# Lookbook 自身が display option の入力種別(トグル等)をサポートしたら
# この差し替えとテンプレートは削除する。
Rails.application.config.to_prepare do
  field_component = "Lookbook::DisplayOptions::Field::Component".safe_constantize
  next unless field_component

  override_dir = Rails.root.join("app/components/lookbook/display_options/field")
  field_component.define_singleton_method(:sidecar_files) do |extensions|
    Dir[override_dir.join("component.*{#{extensions.join(',')}}").to_s].sort
  end
end
