'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
      // TODO:
      // Upload to Cloudinary here.
      // Replace this temporary preview with the uploaded URL.

      const localPreview = URL.createObjectURL(file)

      update('previewPhoto', localPreview as Property['previewPhoto'])
    } finally {
      setUploading(false)
    }
  }

  function removeImage() {
    update('previewPhoto', '' as Property['previewPhoto'])
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

        {property.previewPhoto ? (
          <div className="space-y-3">
            <img
              src={property.previewPhoto}
              alt=""
              className="w-full max-h-80 rounded-lg border object-cover"
            />

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
              value={property.previewPhoto ?? ''}
              onChange={(e) =>
                update('previewPhoto', e.target.value as Property['previewPhoto'])
              }
            />
          </div>
        )}
      </section>

      {/* Google Photos */}
      <section className="space-y-2">
        <label className="font-medium">
          Google Photos Album
        </label>

        <Input
          value={property.previewPhoto ?? ''}
          onChange={(e) =>
            update('previewPhoto', e.target.value as Property['previewPhoto'])
          }
        />
      </section>

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