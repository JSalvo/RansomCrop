# frozen_string_literal: true

module RansomCrop
  class ImagesController < ::ActionController::Base
    layout false
    
    protect_from_forgery with: :exception

    ALLOWED_EXTENSIONS = %w[.jpg .jpeg .png .webp].freeze
    TOKEN_FORMAT = /\A[0-9a-f]{32}\z/

    before_action :set_image_path, only: %i[show crop file]



    def file
      send_file @image_path, disposition: "inline"
    end

    def new; end

    def create
      file = params[:image]
      ext = File.extname(file.try(:original_filename).to_s).downcase

      unless file.respond_to?(:tempfile) && ALLOWED_EXTENSIONS.include?(ext)
        return redirect_to new_image_path, alert: "File non valido"
      end

      token = SecureRandom.hex(16)
      FileUtils.mkdir_p(storage_dir)
      FileUtils.cp(file.tempfile.path, storage_dir.join("#{token}#{ext}"))

      redirect_to image_path(token)
    end

    def show
      @token = params[:id]

    end

    def crop
      regions = JSON.parse(params[:regions].to_s)
      zip_data = build_zip(regions)

      send_data zip_data,
                type: "application/zip",
                filename: "ransom_crop.zip"
    end

    private

    def storage_dir
      Rails.root.join("tmp", "ransom_crop")
    end

    def set_image_path
      token = params[:id].to_s
      raise ActionController::RoutingError, "Not Found" unless token.match?(TOKEN_FORMAT)

      @image_path = Dir.glob(storage_dir.join("#{token}.*")).first
      raise ActionController::RoutingError, "Not Found" unless @image_path
    end

    def build_zip(regions)
      ext = File.extname(@image_path)
      width, height = Vips::Image.new_from_file(@image_path).size

      buffer = Zip::OutputStream.write_buffer do |zip|
        regions.each_with_index do |r, i|
          x = r["x"].to_i.clamp(0, width - 1)
          y = r["y"].to_i.clamp(0, height - 1)
          w = r["width"].to_i.clamp(1, width - x)
          h = r["height"].to_i.clamp(1, height - y)

          cropped = ImageProcessing::Vips.source(@image_path).crop(x, y, w, h).call
          name = r["name"].to_s.parameterize.presence || "porzione"

          zip.put_next_entry("#{i + 1}-#{name}#{ext}")
          zip.write(File.binread(cropped.path))
          cropped.close!
        end

        zip.put_next_entry("regions.json")
        zip.write(JSON.pretty_generate(
          regions.map do |r|
            {
              name: r["name"].to_s,
              color: r["color"].to_s,
              x: r["x"].to_i, y: r["y"].to_i,
              width: r["width"].to_i, height: r["height"].to_i
            }
          end
        ))
      end

      buffer.string
    end
  end
end