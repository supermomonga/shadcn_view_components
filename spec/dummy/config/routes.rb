# frozen_string_literal: true

Dummy::Application.routes.draw do
  mount Lookbook::Engine, at: "/lookbook"

  root "pages#button"
  get "pages/button", to: "pages#button"
  get "pages/toggles", to: "pages#toggles"
  get "pages/echo", to: "pages#echo"
end
