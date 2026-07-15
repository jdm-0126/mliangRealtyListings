'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Lightbox from './LightBox'

interface ImageGalleryProps {
  photos: string[]
  alt: string
}

export default function ImageGallery({
  photos,
  alt,
}: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(0)
  }, [photos])

  useEffect(() => {
    if (photos.length <= 1) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveIndex((p) => (p - 1 + photos.length) % photos.length)
      }

      if (e.key === 'ArrowRight') {
        setActiveIndex((p) => (p + 1) % photos.length)
      }
    }

    window.addEventListener('keydown', handleKey)

    return () => window.removeEventListener('keydown', handleKey)
  }, [photos.length])

  if (!photos || photos.length === 0) {
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
          className="object-cover opacity-60"
        />

        <div className="absolute inset-0 flex items-end justify-center pb-4">
          <span
            className="text-sm"
            style={{ color: 'var(--est-muted)' }}
          >
            No photos available
          </span>
        </div>
      </div>
    )
  }

  const previous = () =>
    setActiveIndex((p) => (p - 1 + photos.length) % photos.length)

  const next = () =>
    setActiveIndex((p) => (p + 1) % photos.length)

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Main Image */}
        <div
          className="relative w-full aspect-video rounded-2xl overflow-hidden"
        >
          <Image
            src={photos[activeIndex]}
            alt={`${alt} ${activeIndex + 1}`}
            fill
            priority={activeIndex === 0}
            className="object-cover cursor-zoom-in"
            sizes="(max-width:768px)100vw,900px"
            onClick={() => {
              setLightboxIndex(activeIndex)
              setLightboxOpen(true)
            }}
          />

          {/* Counter */}
          {photos.length > 1 && (
            <div
              className="absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: 'rgba(0,0,0,.65)',
                color: '#fff',
              }}
            >
              {activeIndex + 1} / {photos.length}
            </div>
          )}

          {/* Previous */}
          {photos.length > 1 && (
            <button
              onClick={previous}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(0,0,0,.55)',
                color: '#fff',
              }}
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(0,0,0,.55)',
                color: '#fff',
              }}
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveIndex(index)
                  setLightboxIndex(index)
                  setLightboxOpen(true)
                }}
                className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0"
                style={{
                  border:
                    index === activeIndex
                      ? '2px solid var(--est-purple)'
                      : '2px solid var(--est-border)',
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
            {/* Fullscreen Lightbox */}
            {lightboxOpen && (
                <Lightbox
                photos={photos}
                index={lightboxIndex}
                alt={alt}
                onClose={() => setLightboxOpen(false)}
                />
            )}
          </div>
        )}
      </div>

      
    </>
  )
}