# frozen_string_literal: true

RansomCrop::Engine.routes.draw do
  resources :images, only: %i[new create show] do
    member do
      post :crop
      get :file
    end
  end

  mount RansomCrop::Engine => "/ransom_crop"

  root to: "images#new"
end