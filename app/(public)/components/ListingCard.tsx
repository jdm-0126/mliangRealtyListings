'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { PublicListing } from '@/lib/types/public'
import { MapPin, Maximize2, Home, X } from 'lucide-react'
import MaintenanceEditBar from './MaintenanceEditBar'

interface ListingCardProps {
  listing: PublicListing
  priority?: boolean   // pass true for the first card to preload as LCP image
}

function formatPrice(price: number | null): string {
  if (price === null) return 'Price on request'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(price)
}

function MapModal({ url, onClose }: { url: string; onClose: () => void }) {
  const embedUrl = url.includes('maps/embed')
    ? url
    : `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed`

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" /> Location Map
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <iframe
          src={embedUrl}
          width="100%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Property location map"
        />
      </div>
    </div>
  )
}

export default function ListingCard({ listing: initialListing, priority = false }: ListingCardProps) {
  const [listing, setListing] = useState(initialListing)
  const [showMap, setShowMap] = useState(false)
  // Always start as false so server and first client render agree (no mismatch).
  // For priority cards the image loads eagerly anyway; the skeleton fades out
  // once the image fires onLoad.
  const [imageLoaded, setImageLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const imageRef = useRef<HTMLDivElement | null>(null)
  const locationText = [listing.village, listing.location].filter(Boolean).join(', ')
  const href = `/listings/${listing.displayId}`
  const imageSrc = listing.previewPhoto || 'https://res.cloudinary.com/https-www-uplift-management-com/image/upload/c_thumb,w_200,g_face/v1783475294/GalleryMliang/26c4084b-c28f-4f24-9585-feb1b7c199e6_jk4jdd.png'
  const displayType = formatListingType(listing.type)

  // Show image once it's either in-view (lazy) or priority
  const showImage = priority || inView

  function formatListingType(type?: string | null): string {
    const value = (type ?? '').trim().toLowerCase()
    if (!value) return ''
    if (value.includes('commercial')) return 'Commercial'
    if (value.includes('house') || value.includes('residential')) return 'House and Lot'
    if (value.includes('lot only') || value === 'lot') return 'Lot only'
    if (value.includes('lot')) return 'Lot only'
    return type?.trim() || ''
  }

  useEffect(() => {
    if (priority) {
      setInView(true)
      return
    }
    const node = imageRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [priority])

  return (
    <div className="relative group">
      <MaintenanceEditBar
        listing={listing}
        onUpdated={updated => setListing(prev => ({ ...prev, ...updated }))}
      />
      <Link
        href={href}
        className="block rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
        style={{ background: 'var(--est-card)', border: '1px solid var(--est-border)' }}
      >
        {/* Photo */}
        <div ref={imageRef} className="relative h-52 overflow-hidden" style={{ background: 'var(--est-elevated)' }}>
          {/* Skeleton — visible until image loads, hidden via opacity */}
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              background: 'linear-gradient(90deg, var(--est-elevated) 25%, rgba(255,255,255,0.08) 50%, var(--est-elevated) 75%)',
              backgroundSize: '200% 100%',
              opacity: imageLoaded ? 0 : 1,
              transition: 'opacity 0.3s',
              pointerEvents: 'none',
            }}
          />
          {/* Image — only mounted once in-view, fades in on load */}
          {showImage && (
            <Image
              src={imageSrc}
              alt={listing.previewPhoto ? `${listing.type} in ${listing.location}` : 'No photo available'}
              fill
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
              loading={priority ? 'eager' : 'lazy'}
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onLoad={() => setImageLoaded(true)}
              style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
            />
          )}
          {displayType && (
            <span
              className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: 'var(--est-purple)', color: '#fff' }}
            >
              {displayType.includes('Commercial') ? 'Commercial' : displayType.includes('Lot') ? 'Lot only' : displayType.includes('House') ? 'House and Lot' : displayType}
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="p-5">
          {/* Location row with map pin */}
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--est-purple)' }} />
            <p className="text-xs truncate flex-1" style={{ color: 'var(--est-muted)' }}>{locationText}</p>
            {listing.mapUrl && (
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); setShowMap(true) }}
                className="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 transition-opacity hover:opacity-80"
                style={{ background: 'var(--est-purple)', color: '#fff' }}
                title="View on map"
              >
                <MapPin className="w-2.5 h-2.5" /> Map
              </button>
            )}
          </div>

          <p
            className="text-lg font-bold mb-4"
            style={{ color: listing.price ? 'var(--est-text)' : 'var(--est-muted)' }}
          >
            {formatPrice(listing.price)}
          </p>

          {(listing.lotArea !== null || listing.floorArea !== null) && (
            <div
              className="flex items-center gap-4 pt-4 text-xs"
              style={{ borderTop: '1px solid var(--est-border)', color: 'var(--est-muted)' }}
            >
              {listing.floorArea !== null && (
                <span className="flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" style={{ color: 'var(--est-purple)' }} />
                  {listing.floorArea.toLocaleString()} sqm
                </span>
              )}
              {listing.lotArea !== null && (
                <span className="flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" style={{ color: 'var(--est-purple)' }} />
                  {listing.lotArea.toLocaleString()} sqm lot
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Map modal — outside the Link so it doesn't navigate */}
      {showMap && listing.mapUrl && (
        <MapModal url={listing.mapUrl} onClose={() => setShowMap(false)} />
      )}
    </div>
  )
}
