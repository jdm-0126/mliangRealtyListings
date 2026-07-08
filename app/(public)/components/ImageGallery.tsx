'use client'
// app/(public)/components/ImageGallery.tsx — Estatein dark theme

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageGalleryProps {
  photos: string[]
  alt: string
}

export default function ImageGallery({ photos, alt }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => { setActiveIndex(0) }, [photos])

  useEffect(() => {
    if (photos.length <= 1) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') setActiveIndex(p => (p - 1 + photos.length) % photos.length)
      else if (e.key === 'ArrowRight') setActiveIndex(p => (p + 1) % photos.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [photos.length])

  if (photos.length === 0) {
    return (
      <div
        className="relative w-full h-64 rounded-2xl overflow-hidden"
        style={{ background: 'var(--est-elevated)', border: '1px solid var(--est-border)' }}
      >
        <Image
          src="https://res.cloudinary.com/https-www-uplift-management-com/image/upload/c_thumb,w_200,g_face/v1783475294/GalleryMliang/26c4084b-c28f-4f24-9585-feb1b7c199e6_jk4jdd.png"
          alt="No photos available"
          fill
          className="object-cover opacity-60"
          sizes="(max-width: 768px) 100vw, 800px"
        />
        <p className="absolute bottom-3 left-0 right-0 text-center text-xs" style={{ color: 'var(--est-muted)' }}>No photos available</p>
      </div>
    )
  }

  const goLeft = () => setActiveIndex(p => (p - 1 + photos.length) % photos.length)
  const goRight = () => setActiveIndex(p => (p + 1) % photos.length)

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="relative w-full aspect-video rounded-2xl overflow-hidden"
        style={{ background: 'var(--est-elevated)', border: '1px solid var(--est-border)' }}
      >
        <Image
          src={photos[activeIndex]}
          alt={`${alt} ${activeIndex + 1} of ${photos.length}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
          priority={activeIndex === 0}
        />

        {/* Counter pill */}
        {photos.length > 1 && (
          <div
            className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', backdropFilter: 'blur(4px)' }}
          >
            {activeIndex + 1} / {photos.length}
          </div>
        )}

        {/* Nav arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goLeft}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goRight}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex flex-row gap-2 overflow-x-auto pb-1" role="list" aria-label="Photo thumbnails">
          {photos.map((url, index) => (
            <button
              key={index}
              role="listitem"
              onClick={() => setActiveIndex(index)}
              aria-label={`View photo ${index + 1} of ${photos.length}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all hover:opacity-90 focus:outline-none"
              style={{
                border: index === activeIndex
                  ? '2px solid var(--est-purple)'
                  : '2px solid var(--est-border)',
              }}
            >
              <Image
                src={url}
                alt={`${alt} thumbnail ${index + 1}`}
                fill
                loading="lazy"
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
