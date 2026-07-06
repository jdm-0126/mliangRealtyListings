// app/(public)/listings/[id]/page.tsx
// Server Component — no 'use client'

import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/app/lib/supabaseClient'
import type { PublicListing } from '@/lib/types/public'
import { buildRealEstateListingJsonLd, generateDetailTitle, buildCanonicalUrl } from '@/lib/seo/jsonld'
import ImageGallery from '@/app/(public)/components/ImageGallery'
import JsonLd from '@/app/(public)/components/JsonLd'
import { MapPin, Maximize2, Home, BedDouble, Bath, Mail } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseNum(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
  return isNaN(n) || n <= 0 ? null : n
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(price)
}

// ---------------------------------------------------------------------------
// Data fetch + mapping
// ---------------------------------------------------------------------------

async function fetchListing(displayId: number): Promise<PublicListing | null> {
  if (!supabase) return null

  // Reverse the displayId-to-internalId transform:
  // Admin logic: displayId = id > 2 ? id - 1 : id
  // Reverse:     internalId = displayId >= 2 ? displayId + 1 : displayId
  const internalId = displayId >= 2 ? displayId + 1 : displayId

  const { data, error } = await supabase
    .from('mlianglistings')
    .select('*')
    .eq('Property ID', internalId)
    .single()

  if (error || !data) return null

  const row = data as Record<string, unknown>

  // Only surface active listings to the public
  const status = String(row['Status'] ?? '').toLowerCase()
  if (status !== 'active') return null

  const id = Number(row['Property ID'])

  // Collect all photo URLs — Preview Photo first, then Photo 1…Photo 20
  const photos: string[] = []
  const previewRaw = row['Preview Photo']
  if (typeof previewRaw === 'string' && previewRaw.trim()) {
    photos.push(previewRaw.trim())
  }
  for (let i = 1; i <= 20; i++) {
    const photoRaw = row[`Photo ${i}`]
    if (typeof photoRaw === 'string' && photoRaw.trim() && !photos.includes(photoRaw.trim())) {
      photos.push(photoRaw.trim())
    }
  }

  return {
    id,
    displayId,
    type: String(row['Type'] ?? ''),
    location: String(row['Location'] ?? ''),
    village: typeof row['Village'] === 'string' && row['Village'].trim() ? row['Village'].trim() : undefined,
    price: parseNum(row['Listing Price'] ?? row['ListingPrice'] ?? row['Price']),
    lotArea: parseNum(row['Lot Area'] ?? row['Lot Area sqm'] ?? row['LA']),
    floorArea: parseNum(row['Floor Area'] ?? row['Floor Area sqm']),
    bedrooms: parseNum(row['Bedroom']),
    bathrooms: parseNum(row['Bathroom']),
    previewPhoto: photos[0] ?? null,
    photos,
    notes: String(row['Notes'] ?? ''),
    status: String(row['Status'] ?? ''),
    updatedAt: typeof row['updated_at'] === 'string' ? row['updated_at'] : undefined,
  }
}

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const displayId = Number(id)

  if (isNaN(displayId)) {
    return { title: 'Property Not Found – M. Liang Realty' }
  }

  const listing = await fetchListing(displayId)

  if (!listing) {
    return { title: 'Property Not Found – M. Liang Realty' }
  }

  const title = generateDetailTitle(listing.type, listing.location)
  const rawNotes = listing.notes ?? ''
  const description =
    rawNotes.length > 157 ? rawNotes.slice(0, 157) + '...' : rawNotes || title

  const canonicalUrl = buildCanonicalUrl(
    'https://realtyprov1.com',
    `/listings/${listing.displayId}`,
  )

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: listing.previewPhoto ? [{ url: listing.previewPhoto }] : [],
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: listing.previewPhoto ? [listing.previewPhoto] : [],
    },
    alternates: { canonical: canonicalUrl },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params
  const displayId = Number(id)

  // Invalid segment
  if (isNaN(displayId)) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-3">Property not found</h1>
        <p className="text-gray-500 mb-8">
          This listing may have been removed or is no longer available.
        </p>
        <Link
          href="/listings"
          className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Back to Listings
        </Link>
      </main>
    )
  }

  const listing = await fetchListing(displayId)

  // Not found
  if (!listing) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-3">Property not found</h1>
        <p className="text-gray-500 mb-8">
          This listing may have been removed or is no longer available.
        </p>
        <Link
          href="/listings"
          className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Back to Listings
        </Link>
      </main>
    )
  }

  // Build contact href — pre-fill property address as the "property of interest"
  const addressParts = [listing.village, listing.location].filter(Boolean)
  const address = addressParts.join(', ') || listing.location
  const contactHref = `/contact?property=${encodeURIComponent(address)}`

  return (
    <>
      <JsonLd data={buildRealEstateListingJsonLd(listing)} />

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/listings"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-6"
        >
          ← Back to Listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Left: photo gallery ── */}
          <ImageGallery
            photos={listing.photos}
            alt={`${listing.type} in ${listing.location}`}
          />

          {/* ── Right: property details ── */}
          <div className="flex flex-col gap-4">
            {/* Type badge + property number */}
            <div className="flex items-center gap-2 flex-wrap">
              {listing.type && (
                <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {listing.type}
                </span>
              )}
              <span className="text-xs text-gray-400">Property #{listing.displayId}</span>
            </div>

            {/* Location */}
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" aria-hidden="true" />
              <span className="text-sm">{address}</span>
            </div>

            {/* Price */}
            {listing.price !== null ? (
              <p className="text-3xl font-bold text-blue-700">{formatPrice(listing.price)}</p>
            ) : (
              <p className="text-xl font-semibold text-gray-500 italic">Price on request</p>
            )}

            {/* Key specs — only non-null fields */}
            {(listing.lotArea !== null ||
              listing.floorArea !== null ||
              listing.bedrooms !== null ||
              listing.bathrooms !== null) && (
              <div className="grid grid-cols-2 gap-3 py-4 border-t border-b border-gray-100">
                {listing.lotArea !== null && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Maximize2 className="w-4 h-4 text-gray-400" aria-hidden="true" />
                    <span>
                      <span className="font-medium">{listing.lotArea.toLocaleString()}</span> sqm lot
                    </span>
                  </div>
                )}
                {listing.floorArea !== null && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Home className="w-4 h-4 text-gray-400" aria-hidden="true" />
                    <span>
                      <span className="font-medium">{listing.floorArea.toLocaleString()}</span> sqm floor
                    </span>
                  </div>
                )}
                {listing.bedrooms !== null && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <BedDouble className="w-4 h-4 text-gray-400" aria-hidden="true" />
                    <span>
                      <span className="font-medium">{listing.bedrooms}</span>{' '}
                      bedroom{listing.bedrooms !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {listing.bathrooms !== null && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Bath className="w-4 h-4 text-gray-400" aria-hidden="true" />
                    <span>
                      <span className="font-medium">{listing.bathrooms}</span>{' '}
                      bathroom{listing.bathrooms !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Notes / description */}
            {listing.notes && (
              <div>
                <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-2">
                  Description
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {listing.notes}
                </p>
              </div>
            )}

            {/* Contact CTA */}
            <div className="mt-auto pt-4">
              <Link
                href={contactHref}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                Contact About This Property
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
