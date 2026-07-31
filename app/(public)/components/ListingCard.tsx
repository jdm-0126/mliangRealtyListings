'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Property } from '@/lib/shared/types/public'
import { MapPin, Maximize2, Home, X, BedDouble, Bath } from 'lucide-react'
import MaintenanceEditBar from './MaintenanceEditBar'
import { supabase } from '@/lib/supabase/browserTenantClient' // Adjust to your Supabase client path

interface ListingCardProps {
  listing: Property
  priority?: boolean     // pass true for the first card to preload as LCP image
  viewMode?: 'grid' | 'list'  // default 'grid' for backwards compat with featured section
  onEdit?: (listing: Property) => void
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

export default function ListingCard({ listing: initialListing, priority = false, viewMode = 'grid', onEdit }: ListingCardProps) {
  const [listing, setListing] = useState(initialListing)
  const [showMap, setShowMap] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const [galleryPhotoUrl, setGalleryPhotoUrl] = useState<string | null>(null)
  const imageRef = useRef<HTMLDivElement | null>(null)

  const locationText = [listing.village, listing.location].filter(Boolean).join(', ')
  const href = `/listings/${listing.propertyId}`
  
  // High-res remote fallback to eliminate local static 404 errors
  const FALLBACK_IMG = 'https://res.cloudinary.com/https-www-uplift-management-com/image/upload/c_thumb,w_200,g_face/v1783475294/GalleryMliang/26c4084b-c28f-4f24-9585-feb1b7c199e6_jk4jdd.png'
  
  const OPTIMIZABLE = /(supabase\.co|cloudinary\.com|fbcdn\.net|googleusercontent\.com|drive\.google\.com)$/
  function isOptimizable(url: string): boolean {
    if (url.startsWith('data:')) return false
    try { return OPTIMIZABLE.test(new URL(url).hostname) } catch { return false }
  }

  // 1. Fetch latest image from gallery table if preview_photo is missing
  useEffect(() => {
  async function fetchFirstGalleryPhoto() {
    // Skip if preview_photo exists or propertyId is missing
    if (listing.preview_photo?.trim() || !listing.propertyId) return
    
    // Select the first uploaded image (created_at ascending)
    const { data, error } = await supabase
      .from('gallery')
      .select('url')
      .eq('property_id', listing.propertyId)
      .order('created_at', { ascending: true }) // First uploaded photo
      .limit(1)
      .maybeSingle()

    if (!error && data?.url) {
      setGalleryPhotoUrl(data.url)
    }
  }

  fetchFirstGalleryPhoto()
}, [listing.propertyId, listing.preview_photo])

  // 2. Derive image source prioritized: preview_photo -> latest gallery photo -> fallback
  const imageSrc =
    listing.preview_photo?.trim() ||
    galleryPhotoUrl ||
    FALLBACK_IMG

  const useNextImage = isOptimizable(imageSrc)
  const displayType = formatListingType(listing.type)
  const listingMode = listing.listingMode?.toLowerCase().includes('rent') ? 'For Rent'
    : listing.listingMode?.toLowerCase().includes('sale') ? 'For Sale'
    : null

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

    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight + 200) {
      setInView(true)
      return
    }

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
        onEdit={() => onEdit?.(listing)}
        onUpdated={updated => setListing(prev => ({ ...prev, ...updated }))}
      />

      {/* ── LIST VIEW ─────────────────────────────────────────────────── */}
      {viewMode === 'list' ? (
        <Link
          href={href}
          className="flex items-stretch gap-0 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
          style={{ background: 'var(--est-card)', border: '1px solid var(--est-border)' }}
        >
          <div
            ref={imageRef}
            className="relative flex-shrink-0 w-36 sm:w-48 overflow-hidden"
            style={{ background: 'var(--est-elevated)', minHeight: '120px' }}
          >
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
            {showImage && (
              useNextImage ? (
                <Image
                  src={imageSrc}
                  alt={`${listing.type || 'Property'} in ${listing.location || 'Location'}`}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  loading={priority ? 'eager' : 'lazy'}
                  priority={priority}
                  sizes="(max-width: 640px) 144px, 192px"
                  onLoad={() => setImageLoaded(true)}
                  style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
                />
              ) : (
                <img
                  src={imageSrc}
                  alt={`${listing.type || 'Property'} in ${listing.location || 'Location'}`}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  loading={priority ? 'eager' : 'lazy'}
                  onLoad={() => setImageLoaded(true)}
                  style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
                />
              )
            )}
            {displayType && (
              <span
                className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--est-purple)', color: '#fff' }}
              >
                {displayType}
              </span>
            )}
            {listingMode && (
              <span
                className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: listingMode === 'For Rent' ? '#0ea5e9' : '#16a34a', color: '#fff' }}
              >
                {listingMode}
              </span>
            )}
          </div>

          <div className="flex flex-col justify-between flex-1 p-4 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-base font-bold leading-tight" style={{ color: listing.listingPrice ? 'var(--est-text)' : 'var(--est-muted)' }}>
                {formatPrice(Number(listing.listingPrice))}
              </p>
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

            <div className="flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--est-purple)' }} />
              <p className="text-xs truncate" style={{ color: 'var(--est-muted)' }}>{locationText}</p>
            </div>

            {(listing.lotArea !== null || listing.floorArea !== null || listing.bedrooms !== null || listing.bathrooms !== null) && (
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--est-muted)' }}>
                {listing.floorArea !== null && (
                  <span className="flex items-center gap-1">
                    <Home className="w-3 h-3" style={{ color: 'var(--est-purple)' }} />
                    {(listing.floorArea ?? 0).toLocaleString()} sqm lot
                  </span>
                )}
                {listing.lotArea !== null && (
                  <span className="flex items-center gap-1">
                    <Maximize2 className="w-3 h-3" style={{ color: 'var(--est-purple)' }} />
                    {(listing.lotArea ?? 0).toLocaleString()} sqm lot
                  </span>
                )}
                {listing.bedrooms !== null && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-3 h-3" style={{ color: 'var(--est-purple)' }} />
                    {listing.bedrooms} bd
                  </span>
                )}
                {listing.bathrooms !== null && (
                  <span className="flex items-center gap-1">
                    <Bath className="w-3 h-3" style={{ color: 'var(--est-purple)' }} />
                    {listing.bathrooms} ba
                  </span>
                )}
              </div>
            )}
          </div>
        </Link>

      ) : (
      /* ── GRID VIEW ──────────────────────────────────────────────────── */
        <Link
          href={href}
          className="block rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
          style={{ background: 'var(--est-card)', border: '1px solid var(--est-border)' }}
        >
          <div ref={imageRef} className="relative h-52 overflow-hidden" style={{ background: 'var(--est-elevated)' }}>
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
            {showImage && (
              useNextImage ? (
                <Image
                  src={imageSrc}
                  alt={`${listing.type || 'Property'} in ${listing.location || 'Location'}`}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  loading={priority ? 'eager' : 'lazy'}
                  priority={priority}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  onLoad={() => setImageLoaded(true)}
                  style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
                />
              ) : (
                <img
                  src={imageSrc}
                  alt={`${listing.type || 'Property'} in ${listing.location || 'Location'}`}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  loading={priority ? 'eager' : 'lazy'}
                  onLoad={() => setImageLoaded(true)}
                  style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
                />
              )
            )}
            {displayType && (
              <span
                className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: 'var(--est-purple)', color: '#fff' }}
              >
                {displayType}
              </span>
            )}
            {listingMode && (
              <span
                className="absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: listingMode === 'For Rent' ? '#0ea5e9' : '#16a34a', color: '#fff' }}
              >
                {listingMode}
              </span>
            )}
          </div>

          <div className="p-5">
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

            <p className="text-lg font-bold mb-4" style={{ color: listing.listingPrice ? 'var(--est-text)' : 'var(--est-muted)' }}>
              {formatPrice(Number(listing.listingPrice))}
            </p>

            {(listing.lotArea !== null || listing.floorArea !== null) && (
              <div className="flex items-center gap-4 pt-4 text-xs" style={{ borderTop: '1px solid var(--est-border)', color: 'var(--est-muted)' }}>
                {listing.floorArea !== null && (
                  <span className="flex items-center gap-1">
                    <Home className="w-3.5 h-3.5" style={{ color: 'var(--est-purple)' }} />
                    {(listing.floorArea ?? 0).toLocaleString()} sqm lot
                  </span>
                )}
                {listing.lotArea !== null && (
                  <span className="flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5" style={{ color: 'var(--est-purple)' }} />
                    {(listing.lotArea ?? 0).toLocaleString()} sqm lot
                  </span>
                )}
              </div>
            )}
          </div>
        </Link>
      )}

      {/* <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onEdit?.(listing)
        }}
        className="absolute top-3 left-3 z-30 rounded bg-blue-600 px-3 py-1 text-white"
      >
        Edit
      </button> */}

      {showMap && listing.mapUrl && (
        <MapModal url={listing.mapUrl} onClose={() => setShowMap(false)} />
      )}
    </div>
  )
}