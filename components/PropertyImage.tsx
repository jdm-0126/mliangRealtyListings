import React, { useState, useMemo, useRef } from 'react'
import { Property } from '@/lib/shared/types/public'
import { ImagePlus } from 'lucide-react'


interface PropertyImageProps {
  property: Property
  onFullscreen: () => void
}


export function PropertyImage({
  property,
  onFullscreen
}: PropertyImageProps) {

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploadingImage, setUploadingImage] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [newPhotoUrl, setNewPhotoUrl] = useState('')


  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = e.target.files?.[0]

    if (!file) return

    // upload logic
  }


  const handlePhotoUpdate = async () => {

    // save logic

  }


  return (
    <div className="property-image">

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />


      {uploadingImage && (
        <p>
          Uploading image...
        </p>
      )}


      <button
        onClick={onFullscreen}
      >
        View Image
      </button>


    </div>
  )
}