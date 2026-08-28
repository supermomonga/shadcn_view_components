# frozen_string_literal: true

# Rails.root が spec/dummy に解決されるために必要(find_root_with_flag は config.ru を境界とする)。
# 単体起動(Lookbook の確認等)では環境が未読み込みのため require する
# (rspec 経由では rails_helper が既に読んでいるが require は冪等なので影響しない)
require_relative "config/environment"

run Dummy::Application
