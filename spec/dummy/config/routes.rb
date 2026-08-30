# frozen_string_literal: true

Dummy::Application.routes.draw do
  get "pages/button", to: "pages#button"
  get "pages/toggles", to: "pages#toggles"
  get "pages/echo", to: "pages#echo"
  get "pages/tabs", to: "pages#tabs"
  get "pages/dialogs", to: "pages#dialogs"
  get "pages/sheets", to: "pages#sheets"
  get "pages/popovers", to: "pages#popovers"
  get "pages/menus", to: "pages#menus"
  get "pages/commands", to: "pages#commands"
  post "pages/commands", to: "pages#submit_commands"
  get "pages/select", to: "pages#select"
  get "pages/sidebar", to: "pages#sidebar"
  get "pages/calendar", to: "pages#calendar"
  get "pages/carousel", to: "pages#carousel"
  get "pages/form", to: "pages#form"
  post "pages/form", to: "pages#submit_form"

  # Lookbookをルートパスで開く。エンジン内部に /*path のcatch-allルートがあるため、
  # pages/* の明示ルートより後に置く必要がある(先に置くとpagesが吸い込まれる)
  mount Lookbook::Engine, at: "/"
end
