// app/(public)/components/ListingCard.tsx — Estatein dark theme
// Server Component

import Image from 'next/image'
import Link from 'next/link'
import { PublicListing } from '@/lib/types/public'
import { MapPin, Maximize2, Home } from 'lucide-react'

interface ListingCardProps {
  listing: PublicListing
}

function formatPrice(price: number | null): string {
  if (price === null) return 'Price on request'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(price)
}

export default function ListingCard({ listing }: ListingCardProps) {
  const locationText = [listing.village, listing.location].filter(Boolean).join(', ')
  const href = `/listings/${listing.displayId}`

  return (
    <Link
      href={href}
      className="group block rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
      style={{
        background: 'var(--est-card)',
        border: '1px solid var(--est-border)',
      }}
    >
      {/* Photo */}
      <div className="relative h-52 overflow-hidden" style={{ background: 'var(--est-elevated)' }}>
        {listing.previewPhoto ? (
          <Image
            src={listing.previewPhoto}
            alt={`${listing.type} in ${listing.location}`}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="w-16 h-16"
              style={{ color: 'var(--est-border)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 22V12h6v10" />
            </svg>
          </div>
        )}
        {/* Type badge */}
        {listing.type && (
          <span
            className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: 'var(--est-purple)', color: '#fff' }}
          >
            {listing.type}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-5">
        {/* Location */}
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--est-purple)' }} />
          <p className="text-xs truncate" style={{ color: 'var(--est-muted)' }}>{locationText}</p>
        </div>

        {/* Price */}
        <p
          className="text-lg font-bold mb-4 transition-colors"
          style={{ color: listing.price ? 'var(--est-text)' : 'var(--est-muted)' }}
        >
          {formatPrice(listing.price)}
        </p>

        {/* Stats row */}
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
  )
}
