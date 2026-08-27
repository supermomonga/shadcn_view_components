# frozen_string_literal: true

Dummy::Application.routes.draw do
  mount Lookbook::Engine, at: "/lookbook"

  root "pages#button"
  get "pages/button", to: "pages#button"
  get "pages/toggles", to: "pages#toggles"
  get "pages/echo", to: "pages#echo"
  get "pages/tabs", to: "pages#tabs"
  get "pages/dialogs", to: "pages#dialogs"
  get "pages/sheets", to: "pages#sheets"
  get "pages/popovers", to: "pages#popovers"
  get "pages/carousel", to: "pages#carousel"
  get "pages/form", to: "pages#form"
  post "pages/form", to: "pages#submit_form"
end
