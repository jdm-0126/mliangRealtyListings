'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { databases, DATABASE_ID } from '@/lib/appwrite/client'
import { MapPin, Maximize2, Home, BedDouble, Bath, Edit, Trash2, X, ImagePlus } from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tooltip } from './ui/tooltip'
import FeaturedToggle from './FeaturedToggle'

const COL_LISTINGS = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_LISTINGS!

interface PropertyCardProps {
  property: any
  viewMode: 'grid' | 'list'
  onEdit?: (property: any) => void
  onDelete?: (property: any) => void
  onFeaturedChange?: () => void
  canFeature?: boolean
}

function formatPrice(price: any): string {
  if (!price) return 'Price on request'
  const n = typeof price === 'number' ? price : parseFloat(String(price).replace(/[^\d.]/g, ''))
  if (isNaN(n) || n <= 0) return 'Price on request'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n)
}

function formatListingType(type?: string | null): string {
  const v = (type ?? '').trim().toLowerCase()
  if (!v) return ''
  if (v.includes('commercial')) return 'Commercial'
  if (v.includes('house') || v.includes('residential')) return 'House and Lot'
  if (v.includes('lot only') || v === 'lot') return 'Lot only'
  if (v.includes('lot')) return 'Lot only'
  return type?.trim() || ''
}

export default function PropertyCard({
  property,
  viewMode,
  onEdit,
  onDelete,
  onFeaturedChange,
  canFeature = false,
}: PropertyCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const [isEditingPhoto, setIsEditingPhoto] = useState(false)
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editMode = !!(onEdit && onDelete)

  // Field names (Appwrite uses underscores)
  const previewPhoto: string | null = property['Preview_Photo'] || null
  const price = property['Listing_Price']
  const lotArea = property['Lot_Area_sqm']
  const floorArea = property['Floor_Area_sqm']
  const bedrooms = property['Bedroom']
  const bathrooms = property['Bathroom']
  const location: string = property['Location'] || ''
  const village: string = property['Village'] || ''
  const type: string = property['Type'] || ''
  const status: string = property['Status'] || 'Draft'
  const listingMode: string | null = property['Listing_Mode'] || null
  const rawId = Number(property['property_id'])
  const displayId = rawId > 2 ? rawId - 1 : rawId
  const href = `/properties/${displayId}`

  const locationText = [village, location].filter(Boolean).join(', ')
  const displayType = formatListingType(type)
  const listingModeLabel = listingMode?.toLowerCase().includes('rent') ? 'For Rent'
    : listingMode?.toLowerCase().includes('sale') ? 'For Sale'
    : null

  const FALLBACK_IMG = 'https://res.cloudinary.com/https-www-uplift-management-com/image/upload/c_thumb,w_200,g_face/v1783475294/GalleryMliang/26c4084b-c28f-4f24-9585-feb1b7c199e6_jk4jdd.png'

  // Hostnames that next/image can optimise — must match next.config.ts remotePatterns
  const OPTIMIZABLE = /(supabase\.co|cloudinary\.com|fbcdn\.net|googleusercontent\.com|drive\.google\.com)$/

  function isOptimizable(url: string | null): boolean {
    if (!url) return false
    try { return OPTIMIZABLE.test(new URL(url).hostname) } catch { return false }
  }

  const imageSrc = previewPhoto || FALLBACK_IMG
  const useNextImage = isOptimizable(imageSrc)

  useEffect(() => {
    const node = imageRef.current
    if (!node) return

    // If already in viewport, show immediately
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight + 200) {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) { setInView(true); observer.disconnect() } },
      { rootMargin: '200px 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setUploadingImage(true)
    const reader = new FileReader()
    reader.onload = () => { setNewPhotoUrl(reader.result as string); setUploadingImage(false) }
    reader.onerror = () => setUploadingImage(false)
    reader.readAsDataURL(file)
  }

  const handlePhotoUpdate = async () => {
    if (!newPhotoUrl.trim()) return
    try {
      await databases.updateDocument(DATABASE_ID, COL_LISTINGS, property['$id'], { Preview_Photo: newPhotoUrl })
      property['Preview_Photo'] = newPhotoUrl
      setIsEditingPhoto(false)
      setNewPhotoUrl('')
    } catch (e: any) {
      alert('Error updating photo: ' + e.message)
    }
  }

  const statusVariant = status.toLowerCase() === 'active' ? 'success'
    : status.toLowerCase() === 'draft' ? 'warning'
    : 'secondary'

  // ── Shared photo area ──────────────────────────────────────────────────────
  const PhotoArea = ({ height = 'h-52' }: { height?: string }) => (
    <div
      ref={imageRef}
      className={`relative ${height} overflow-hidden`}
      style={{ background: 'var(--est-elevated, #f3f4f6)' }}
    >
      {/* Shimmer */}
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
          backgroundSize: '200% 100%',
          opacity: imageLoaded ? 0 : 1,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
        }}
      />
      {inView && (
        useNextImage ? (
          <Image
            src={imageSrc}
            alt={previewPhoto ? `${type} in ${location}` : 'No photo available'}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onLoad={() => setImageLoaded(true)}
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
          />
        ) : (
          <img
            src={imageSrc}
            alt={previewPhoto ? `${type} in ${location}` : 'No photo available'}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
          />
        )
      )}
      {/* Type badge */}
      {displayType && (
        <span className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-600 text-white">
          {displayType}
        </span>
      )}
      {/* Listing mode badge */}
      {listingModeLabel && (
        <span
          className="absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full text-white"
          style={{ background: listingModeLabel === 'For Rent' ? '#0ea5e9' : '#16a34a' }}
        >
          {listingModeLabel}
        </span>
      )}
      {/* Status badge (bottom-left) */}
      <span className="absolute bottom-3 left-3">
        <Badge variant={statusVariant}>{status}</Badge>
      </span>
      {/* Edit photo overlay — only in edit mode */}
      {editMode && (
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setIsEditingPhoto(true) }}
          className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-end justify-end p-3 opacity-0 group-hover:opacity-100"
        >
          <span className="flex items-center gap-1 text-xs font-semibold bg-white/90 text-gray-800 px-2 py-1 rounded-lg">
            <ImagePlus className="w-3.5 h-3.5" /> Photo
          </span>
        </button>
      )}
      {/* Fullscreen click — only when not in edit mode */}
      {!editMode && previewPhoto && (
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setIsFullscreen(true) }}
          className="absolute inset-0"
          aria-label="View fullscreen"
        />
      )}
    </div>
  )

  return (
    <>
      <div className="relative group">
        {/* ── GRID VIEW ─────────────────────────────────────────────────── */}
        {viewMode === 'grid' ? (
          <div
            className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'var(--est-card, #fff)', border: '1px solid var(--est-border, #e5e7eb)' }}
          >
            <PhotoArea />

            <div className="p-5">
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-indigo-500" />
                <p className="text-xs truncate flex-1 text-gray-500">{locationText || '—'}</p>
              </div>

              <p className="text-lg font-bold mb-3 text-gray-900">{formatPrice(price)}</p>

              {(lotArea || floorArea || bedrooms || bathrooms) && (
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 pt-3 text-xs text-gray-500 border-t border-gray-100">
                  {floorArea && (
                    <span className="flex items-center gap-1">
                      <Home className="w-3.5 h-3.5 text-indigo-400" />
                      {Number(floorArea).toLocaleString()} sqm
                    </span>
                  )}
                  {lotArea && (
                    <span className="flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                      {Number(lotArea).toLocaleString()} sqm lot
                    </span>
                  )}
                  {bedrooms && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5 text-indigo-400" />
                      {bedrooms} bd
                    </span>
                  )}
                  {bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-indigo-400" />
                      {bathrooms} ba
                    </span>
                  )}
                </div>
              )}

              {/* Action row */}
              <div className="flex gap-2 mt-4">
                {editMode ? (
                  <>
                    <Tooltip content="Edit property">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit!(property)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Delete property">
                      <Button variant="outline" size="sm" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => onDelete!(property)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                    <FeaturedToggle
                      propertyId={property['property_id']}
                      isFeatured={!!property.featured}
                      canToggle={canFeature}
                      onToggle={onFeaturedChange}
                    />
                  </>
                ) : (
                  <Link href={href} className="flex-1">
                    <Button variant="default" size="sm" className="w-full">View Details</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

        ) : (
        /* ── LIST VIEW ──────────────────────────────────────────────────── */
          <div
            className="flex items-stretch gap-0 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'var(--est-card, #fff)', border: '1px solid var(--est-border, #e5e7eb)' }}
          >
            {/* Thumbnail */}
            <div className="relative flex-shrink-0 w-36 sm:w-48" style={{ minHeight: 120 }}>
              <PhotoArea height="h-full" />
            </div>

            {/* Details */}
            <div className="flex flex-col justify-between flex-1 p-4 min-w-0">
              <div>
                <p className="text-base font-bold text-gray-900 mb-1">{formatPrice(price)}</p>
                <div className="flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3 flex-shrink-0 text-indigo-500" />
                  <p className="text-xs truncate text-gray-500">{locationText || '—'}</p>
                </div>
                {(lotArea || floorArea || bedrooms || bathrooms) && (
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                    {floorArea && <span className="flex items-center gap-1"><Home className="w-3 h-3 text-indigo-400" />{Number(floorArea).toLocaleString()} sqm</span>}
                    {lotArea && <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3 text-indigo-400" />{Number(lotArea).toLocaleString()} sqm lot</span>}
                    {bedrooms && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3 text-indigo-400" />{bedrooms} bd</span>}
                    {bathrooms && <span className="flex items-center gap-1"><Bath className="w-3 h-3 text-indigo-400" />{bathrooms} ba</span>}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                {editMode ? (
                  <>
                    <Tooltip content="Edit property">
                      <Button variant="outline" size="sm" onClick={() => onEdit!(property)}><Edit className="w-4 h-4" /></Button>
                    </Tooltip>
                    <Tooltip content="Delete property">
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => onDelete!(property)}><Trash2 className="w-4 h-4" /></Button>
                    </Tooltip>
                    <FeaturedToggle
                      propertyId={property['property_id']}
                      isFeatured={!!property.featured}
                      canToggle={canFeature}
                      onToggle={onFeaturedChange}
                    />
                  </>
                ) : (
                  <Link href={href}>
                    <Button variant="default" size="sm">View Details</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Fullscreen modal ──────────────────────────────────────────────── */}
      {isFullscreen && previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setIsFullscreen(false)}>
          <button onClick={() => setIsFullscreen(false)} className="absolute top-4 right-4 text-white z-10">
            <X className="w-8 h-8" />
          </button>
          <img src={previewPhoto} alt="" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ── Photo update modal ────────────────────────────────────────────── */}
      {isEditingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h4 className="text-lg font-semibold text-center text-gray-900">
              {previewPhoto ? 'Update Preview Photo' : 'Add Preview Photo'}
            </h4>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <ImagePlus className="w-5 h-5" />
              {uploadingImage ? 'Reading…' : 'Upload from Computer'}
            </button>

            <div className="relative flex items-center">
              <div className="flex-1 border-t border-gray-200" />
              <span className="px-3 text-xs text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <input
              type="text"
              value={newPhotoUrl}
              onChange={e => setNewPhotoUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            />

            {newPhotoUrl && (
              <div className="w-full h-40 rounded-lg overflow-hidden border border-gray-200">
                <img src={newPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handlePhotoUpdate}
                disabled={!newPhotoUrl}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium"
              >
                Save
              </button>
              <button
                onClick={() => { setIsEditingPhoto(false); setNewPhotoUrl('') }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
