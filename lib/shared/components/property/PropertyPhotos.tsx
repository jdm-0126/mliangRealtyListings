'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import Image from "next/image";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadPropertyImage } from "@/lib/cloudinary/uploadToCloudinary";

import { Property } from '@/lib/shared/types/public'

interface PropertyPhotosProps {
  property: Property
  onChange: (property: Property) => void
}

export default function PropertyPhotos({
  property,
  onChange,
}: PropertyPhotosProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  function update<K extends keyof Property>(
    key: K,
    value: Property[K]
  ) {
    onChange({
      ...property,
      [key]: value,
    })
  }

  

  async function onFileSelect(file: File) {
  setUploading(true)

  try {
    // Pass existing ID or fallback placeholder if property isn't created yet
    const propertyId = property.id ?? 'temp'
    
    // Upload directly to Cloudinary
    const imageUrl = await uploadPropertyImage(file, propertyId)

    // Save permanent Cloudinary URL to state
    update('preview_photo', imageUrl)
  } catch (error) {
    console.error('Failed to upload photo:', error)
    // Optional: show toast notification to user here
  } finally {
    setUploading(false)
  }
}

  function removeImage() {
    update('preview_photo', undefined as Property['preview_photo'])
  }

  return (
    <div className="space-y-8">
      {/* Preview */}
      <section className="border rounded-lg p-5">
        <h3 className="font-semibold mb-1">
          Featured Preview Photo
        </h3>

        <p className="text-sm text-muted-foreground mb-4">
          Image shown in property cards.
        </p>

        {property.preview_photo ? (
          <div className="space-y-3">
            <div className="relative w-full h-80">
              <Image
                src={
                  preview ??
                  property.preview_photo ??
                  "/images/no-image.jpg"
                }
                alt="Preview"
                fill
                loading="eager"
                priority
                className="object-cover"
              />
            </div>

            <div className="flex gap-2">
              <input
                id="preview-upload"
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]

                  if (file) onFileSelect(file)
                }}
              />

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document
                    .getElementById('preview-upload')
                    ?.click()
                }
              >
                Change Photo
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={removeImage}
              >
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              id="preview-upload"
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]

                if (file) onFileSelect(file)
              }}
            />

            <Button
              type="button"
              className="w-full"
              disabled={uploading}
              onClick={() =>
                document
                  .getElementById('preview-upload')
                  ?.click()
              }
            >
              <Upload className="mr-2 h-4 w-4" />

              {uploading
                ? 'Uploading...'
                : 'Upload Image'}
            </Button>

            <Input
              placeholder="https://..."
              value={property.preview_photo ?? ''}
              onChange={(e) =>
                update('preview_photo', e.target.value as Property['preview_photo'])
              }
            />
          </div>
        )}
      </section>

      {/* Google Photos */}
      {/* <section className="space-y-2">
        <label className="font-medium">
          Google Photos Album
        </label>

        <Input
          value={property.googlePhotosUrl ?? ''}
          onChange={(e) =>
            update('googlePhotosUrl', e.target.value as Property['googlePhotosUrl'])
          }
        />
      </section> */}

      {/* Facebook Listing */}
      <section className="space-y-2">
        <label className="font-medium">
          Facebook Listing
        </label>

        <Input
          value={property.fbLink ?? ''}
          onChange={(e) =>
            update('fbLink', e.target.value as Property['fbLink'])
          }
        />
      </section>

      {/* Video */}
      <section className="space-y-2">
        <label className="font-medium">
          Video URL
        </label>

        <Input
          value={property.videoUrl ?? ''}
          onChange={(e) =>
            update('videoUrl', e.target.value as Property['videoUrl'])
          }
        />
      </section>

      {/* Facebook Video */}
      <section className="space-y-2">
        <label className="font-medium">
          Facebook Video
        </label>

        <Input
          value={property.facebookVideoUrl ?? ''}
          onChange={(e) =>
            update(
              'facebookVideoUrl',
              e.target.value as Property['facebookVideoUrl']
            )
          }
        />
      </section>

      {/* TikTok */}
      <section className="space-y-2">
        <label className="font-medium">
          TikTok Video
        </label>

        <Input
          value={property.tiktokVideoUrl ?? ''}
          onChange={(e) =>
            update(
              'tiktokVideoUrl',
              e.target.value as Property['tiktokVideoUrl']
            )
          }
        />
      </section>
    </div>
  )
}