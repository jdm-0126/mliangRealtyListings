// app/(public)/components/ListingCard.tsx
// Server Component

import Image from 'next/image'
import Link from 'next/link'
import { PublicListing } from '@/lib/types/public'

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
      className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-300 transition-all block"
    >
      {/* Photo */}
      <div className="relative h-48 bg-gray-100">
        {listing.previewPhoto ? (
          <Image
            src={listing.previewPhoto}
            alt={`${listing.type} in ${listing.location}`}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 22V12h6v10" />
            </svg>
          </div>
        )}
        {/* Type badge */}
        <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
          {listing.type}
        </span>
      </div>

      {/* Card body */}
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-1">{locationText}</p>
        <p className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
          {formatPrice(listing.price)}
        </p>

        {/* Area info */}
        {(() => {
          const isLotOnly = listing.type?.toLowerCase().includes('lot only') || listing.type?.toLowerCase() === 'lot'
          if (isLotOnly) {
            return listing.lotArea !== null ? (
              <p className="text-sm text-gray-600">
                <span className="font-medium">{listing.lotArea.toLocaleString()} sqm</span> lot area
              </p>
            ) : null
          }
          return (
            <div className="space-y-0.5">
              {listing.floorArea !== null && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{listing.floorArea.toLocaleString()} sqm</span> floor area
                </p>
              )}
              {listing.lotArea !== null && (
                <p className="text-sm text-gray-500">
                  <span className="font-medium">{listing.lotArea.toLocaleString()} sqm</span> lot area
                </p>
              )}
            </div>
          )
        })()}
      </div>
    </Link>
  )
}
