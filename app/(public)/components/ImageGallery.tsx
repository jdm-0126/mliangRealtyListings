'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

interface ImageGalleryProps {
  photos: string[]
  alt: string
}

function HousePlaceholder() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-16 h-16 text-gray-400"
      aria-hidden="true"
    >
      <path d="M3 9.75L12 3l9 6.75V21a.75.75 0 0 1-.75.75H15v-6h-6v6H3.75A.75.75 0 0 1 3 21V9.75z" />
    </svg>
  )
}

export default function ImageGallery({ photos, alt }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  // Reset active index when photos change (e.g. navigating between listings)
  useEffect(() => {
    setActiveIndex(0)
  }, [photos])

  // Keyboard navigation
  useEffect(() => {
    if (photos.length <= 1) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length)
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev + 1) % photos.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [photos.length])

  // Empty state — placeholder
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 w-full h-64 bg-gray-100 rounded-lg text-gray-500">
        <HousePlaceholder />
        <p className="text-sm">No photos available</p>
      </div>
    )
  }

  const goLeft = () =>
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length)

  const goRight = () =>
    setActiveIndex((prev) => (prev + 1) % photos.length)

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <Image
          src={photos[activeIndex]}
          alt={`${alt} ${activeIndex + 1} of ${photos.length}`}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
          priority={activeIndex === 0}
        />

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goLeft}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <button
              onClick={goRight}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail row */}
      {photos.length > 1 && (
        <div
          className="flex flex-row gap-2 overflow-x-auto pb-1"
          role="list"
          aria-label="Photo thumbnails"
        >
          {photos.map((url, index) => (
            <button
              key={index}
              role="listitem"
              onClick={() => setActiveIndex(index)}
              aria-label={`View photo ${index + 1} of ${photos.length}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={`relative flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                index === activeIndex
                  ? 'border-blue-600'
                  : 'border-transparent hover:border-gray-400'
              }`}
            >
              <Image
                src={url}
                alt={`${alt} thumbnail ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
