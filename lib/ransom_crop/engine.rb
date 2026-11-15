# frozen_string_literal: true

module RansomCrop
  class Engine < ::Rails::Engine
    isolate_namespace RansomCrop

    initializer "ransom_crop.assets" do |app|
      app.config.assets.paths << root.join("app/javascript")
    end

    initializer "ransom_crop.stylesheets" do |app|
      app.config.assets.paths << root.join("app/assets/stylesheets")
    end
    
    initializer "ransom_crop.importmap", before: "importmap" do |app|
      if app.config.respond_to?(:importmap)
        app.config.importmap.paths << root.join("config/importmap.rb")
        app.config.importmap.cache_sweepers << root.join("app/javascript")
      end
    end
  end
end
