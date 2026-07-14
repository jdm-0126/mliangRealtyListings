// app/(public)/components/PropertyDetailView.tsx
// A test-friendly pure display component for the property detail page.
// Accepts a PublicListing prop and renders the relevant fields.
// This is NOT the Next.js page (which is a server component with async data fetching);
// instead, it encapsulates the display logic so it can be unit/property tested.

import React from 'react'
import Link from 'next/link'
import type { PublicListing } from '@/lib/types/public'
import ImageGallery from '../../../components/ImageGallery'

// ---------------------------------------------------------------------------
// Helpers (mirrored from the server page — kept pure so tests can import them)
// ---------------------------------------------------------------------------

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(price)
}

function formatListingType(type?: string | null): string {
  const value = (type ?? '').trim().toLowerCase()
  if (!value) return ''
  if (value.includes('commercial')) return 'Commercial'
  if (value.includes('house') || value.includes('residential')) return 'House and Lot'
  if (value.includes('lot only') || value === 'lot') return 'Lot only'
  if (value.includes('lot')) return 'Lot only'
  return type?.trim() || ''
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PropertyDetailViewProps {
  listing: PublicListing
}

export default function PropertyDetailView({ listing }: PropertyDetailViewProps) {
  const addressParts = [listing.village, listing.location].filter(Boolean)
  const address = addressParts.join(', ') || listing.location
  const contactHref = `/contact?property=${encodeURIComponent(address)}`
  const displayType = formatListingType(listing.type)

  return (
    <main data-testid="property-detail-view">
      {/* Back link */}
      <Link href="/listings" data-testid="back-to-listings">
        ← Back to Listings
      </Link>

      <div>
        {/* ── Left: photo gallery ── */}
        <ImageGallery
          photos={listing.photos}
          alt={`${listing.type} in ${listing.location}`}
        />

        {/* ── Right: property details ── */}
        <div>
          {/* Type badge */}
          {displayType && (
            <span data-testid="property-type">{displayType}</span>
          )}

          {/* Property number */}
          <span data-testid="property-number">Property #{listing.displayId}</span>

          {/* Location — always shown (required field) */}
          <span data-testid="property-location">{address}</span>

          {/* Price */}
          {listing.price !== null ? (
            <p data-testid="property-price">{formatPrice(listing.price)}</p>
          ) : (
            <p data-testid="property-price-on-request">Price on request</p>
          )}

          {/* Lot area */}
          {listing.lotArea !== null && (
            <span data-testid="property-lot-area">
              {listing.lotArea.toLocaleString()} sqm lot
            </span>
          )}

          {/* Floor area */}
          {listing.floorArea !== null && (
            <span data-testid="property-floor-area">
              {listing.floorArea.toLocaleString()} sqm floor
            </span>
          )}

          {/* Bedrooms */}
          {listing.bedrooms !== null && (
            <span data-testid="property-bedrooms">
              {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? 's' : ''}
            </span>
          )}

          {/* Bathrooms */}
          {listing.bathrooms !== null && (
            <span data-testid="property-bathrooms">
              {listing.bathrooms} bathroom{listing.bathrooms !== 1 ? 's' : ''}
            </span>
          )}

          {/* Notes / description */}
          {listing.notes && listing.notes.trim() !== '' && (
            <p data-testid="property-notes">{listing.notes}</p>
          )}

          {/* Contact CTA — always rendered */}
          <Link
            href={contactHref}
            data-testid="contact-cta"
          >
            Contact About This Property
          </Link>
        </div>
      </div>
    </main>
  )
}
