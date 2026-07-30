'use client'

import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface LightboxProps {
  photos: string[]
  index: number
  alt?: string
  onClose: () => void
}

export default function Lightbox({
  photos,
  index,
  alt = "Gallery Image",
  onClose,
}: LightboxProps) {
    
  const [current, setCurrent] = useState(index)

  useEffect(() => {
    setCurrent(index)
  }, [index])

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break

        case 'ArrowLeft':
          setCurrent((p) => (p - 1 + photos.length) % photos.length)
          break

        case 'ArrowRight':
          setCurrent((p) => (p + 1) % photos.length)
          break
      }
    }

    window.addEventListener('keydown', handler)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [photos.length, onClose])

  if (!photos.length) return null



  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-20 text-white hover:text-gray-300 transition"
      >
        <X size={32} />
      </button>

      {/* Previous */}
      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setCurrent((p) => (p - 1 + photos.length) % photos.length)
          }}
          className="absolute left-5 top-1/2 -translate-y-1/2 z-20
                     w-12 h-12 rounded-full bg-black/40 hover:bg-black/60
                     flex items-center justify-center text-white"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Next */}
      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setCurrent((p) => (p + 1) % photos.length)
          }}
          className="absolute right-5 top-1/2 -translate-y-1/2 z-20
                     w-12 h-12 rounded-full bg-black/40 hover:bg-black/60
                     flex items-center justify-center text-white"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Image */}
      <div
        className="max-w-7xl w-full px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <img
        src={photos[current]}
        alt={alt ?? "Gallery Image"}
        className="mx-auto max-h-[82vh] max-w-full object-contain rounded-xl"
        />

        
        
        {photos.length > 1 && (
          <div className="text-center mt-3 text-gray-400 text-sm">
            {current + 1} / {photos.length}
          </div>
        )}
      </div>
    </div>
  )
}