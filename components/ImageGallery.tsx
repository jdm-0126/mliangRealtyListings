'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import Lightbox from './LightBox' // Adjust path if needed (e.g. ./FullscreenImage or ./LightBox)

interface ImageGalleryProps {
  photos: string[]
  alt: string
  onFullscreen?: (index: number) => void
}

export default function ImageGallery({
  photos = [],
  alt,
  onFullscreen,
}: ImageGalleryProps) {
  // 1. Filter out empty strings or invalid values
  const validPhotos = (photos || []).filter(
    (photo) => typeof photo === 'string' && photo.trim() !== ''
  )

  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // 2. Safely resolve current photo with fallback
  const currentPhoto = validPhotos[activeIndex] || '/placeholder.jpg'

  useEffect(() => {
    setActiveIndex(0)
  }, [photos])

  // Keyboard navigation support
  useEffect(() => {
    if (validPhotos.length <= 1) return

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      if (e.key === 'ArrowLeft') {
        setActiveIndex((p) => (p - 1 + validPhotos.length) % validPhotos.length)
      }

      if (e.key === 'ArrowRight') {
        setActiveIndex((p) => (p + 1) % validPhotos.length)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [validPhotos.length])

  // Open Lightbox Trigger
  const handleOpenLightbox = (indexToOpen: number) => {
    setLightboxIndex(indexToOpen)
    setLightboxOpen(true)
    if (onFullscreen) {
      onFullscreen(indexToOpen)
    }
  }

  // Fallback state if no valid photos are available
  if (validPhotos.length === 0) {
    return (
      <div
        className="relative w-full h-72 rounded-2xl overflow-hidden"
        style={{
          background: 'var(--est-elevated)',
          border: '1px solid var(--est-border)',
        }}
      >
        <Image
          src="https://res.cloudinary.com/https-www-uplift-management-com/image/upload/c_thumb,w_400/v1783475294/GalleryMliang/26c4084b-c28f-4f24-9585-feb1b7c199e6_jk4jdd.png"
          alt="No photo"
          fill
          priority
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 flex items-end justify-center pb-4">
          <span className="text-sm" style={{ color: 'var(--est-muted)' }}>
            No photos available
          </span>
        </div>
      </div>
    )
  }

  const previous = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveIndex((p) => (p - 1 + validPhotos.length) % validPhotos.length)
  }

  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveIndex((p) => (p + 1) % validPhotos.length)
  }

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        {/* Main Image Container (Clicking opens Lightbox) */}
        <div
          onClick={() => handleOpenLightbox(activeIndex)}
          className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 cursor-pointer group"
          suppressHydrationWarning
        >
          {currentPhoto ? (
            <Image
              src={currentPhoto}
              alt={alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No image available
            </div>
          )}

          {/* Hover Overlay with Fullscreen Indicator */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5" /> Click to view full screen
            </span>
          </div>

          {/* Left / Right Carousel Controls on Main Image */}
          {validPhotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={previous}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails Row */}
        {validPhotos.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {validPhotos.map((photo, index) => (
              <button
                key={`${photo}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 transition-all hover:opacity-100"
                style={{
                  border:
                    index === activeIndex
                      ? '2px solid var(--est-purple, #9333ea)'
                      : '2px solid var(--est-border, #e5e7eb)',
                  opacity: index === activeIndex ? 1 : 0.7,
                }}
              >
                <Image
                  src={photo}
                  alt={`${alt} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox / Fullscreen Modal */}
      {lightboxOpen && (
        <Lightbox
          photos={validPhotos}
          index={lightboxIndex}
          alt={alt}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}