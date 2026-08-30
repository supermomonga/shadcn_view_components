# frozen_string_literal: true

module Shadcn
  class TabsPreview < Shadcn::PreviewBase
    def default
      render(Shadcn::Tabs.new) do
        safe_join([
                    render(Shadcn::Tabs::List.new) do
                      safe_join([
                                  render(Shadcn::Tabs::Trigger.new(value: "account", active: true)) { "アカウント" },
                                  render(Shadcn::Tabs::Trigger.new(value: "password")) { "パスワード" }
                                ])
                    end,
                    render(Shadcn::Tabs::Content.new(value: "account")) { "アカウント設定の内容" },
                    render(Shadcn::Tabs::Content.new(value: "password")) { "パスワード変更の内容" }
                  ])
      end
    end

    def line
      render(Shadcn::Tabs.new) do
        safe_join([
                    render(Shadcn::Tabs::List.new(variant: :line)) do
                      safe_join([
                                  render(Shadcn::Tabs::Trigger.new(value: "a", active: true)) { "概要" },
                                  render(Shadcn::Tabs::Trigger.new(value: "b")) { "設定" }
                                ])
                    end,
                    render(Shadcn::Tabs::Content.new(value: "a")) { "概要の内容" },
                    render(Shadcn::Tabs::Content.new(value: "b")) { "設定の内容" }
                  ])
      end
    end

    def vertical
      render(Shadcn::Tabs.new(orientation: :vertical)) do
        safe_join([
                    render(Shadcn::Tabs::List.new) do
                      safe_join([
                                  render(Shadcn::Tabs::Trigger.new(value: "account", active: true)) { "アカウント" },
                                  render(Shadcn::Tabs::Trigger.new(value: "password")) { "パスワード" }
                                ])
                    end,
                    render(Shadcn::Tabs::Content.new(value: "account")) { "アカウント設定の内容" },
                    render(Shadcn::Tabs::Content.new(value: "password")) { "パスワード変更の内容" }
                  ])
      end
    end
  end
end
