# frozen_string_literal: true

# Rails.root が spec/dummy に解決されるために必要(find_root_with_flag は config.ru を境界とする)
run Dummy::Application
