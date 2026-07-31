import React, { useState, useMemo, useRef } from 'react'
import { Property } from '@/lib/shared/types/public'
import { ImagePlus } from 'lucide-react'


interface PropertyImageProps {
  property: any;
  photos?: string[];
  onFullscreen: () => void;
}


export function PropertyImage({ property, photos = [], onFullscreen }: PropertyImageProps) {
  // If photos array was passed, use it; otherwise fallback to property.preview_photo or property.Photos
  const displayPhotos = photos.length > 0 
    ? photos 
    : [property?.preview_photo, ...(property?.Photos || [])].filter(Boolean);

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-muted">
      {/* 
        You can now pass `displayPhotos` into your ImageGallery or render the main photo 
      */}
      <img
        src={displayPhotos[0] || "/placeholder.jpg"}
        alt={property?.Title || "Property"}
        className="w-full h-[400px] object-cover cursor-pointer"
        onClick={onFullscreen}
      />
      
      {/* If you have multiple photos, you can render thumbnail selectors here or a photo count badge */}
      {displayPhotos.length > 1 && (
        <span className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
          1 / {displayPhotos.length} Photos
        </span>
      )}
    </div>
  );
}