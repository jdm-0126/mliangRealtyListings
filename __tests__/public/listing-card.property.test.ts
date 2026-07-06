/**
 * Property 7: ListingCard renders all required visible fields for any listing
 * Validates: Requirements 3.2
 */
import * as fc from 'fast-check'
import { render } from '@testing-library/react'
import React from 'react'

// Mock next/image to avoid warnings
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => React.createElement('img', { src, alt }),
}))
// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}))

import ListingCard from '../../app/(public)/components/ListingCard'
import { PublicListing } from '../../lib/types/public'

// Generate arbitrary valid PublicListing objects
const arbitraryListing = fc.record<PublicListing>({
  id: fc.integer({ min: 1, max: 9999 }),
  displayId: fc.integer({ min: 1, max: 9999 }),
  type: fc.string({ minLength: 1, maxLength: 50 }),
  location: fc.string({ minLength: 1, maxLength: 100 }),
  village: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  price: fc.option(fc.integer({ min: 100000, max: 50000000 }), { nil: null }),
  lotArea: fc.option(fc.integer({ min: 50, max: 10000 }), { nil: null }),
  floorArea: fc.option(fc.integer({ min: 30, max: 5000 }), { nil: null }),
  bedrooms: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
  bathrooms: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
  previewPhoto: fc.option(fc.constant('https://example.com/photo.jpg'), { nil: null }),
  photos: fc.array(fc.constant('https://example.com/photo.jpg'), { maxLength: 5 }),
  notes: fc.string({ maxLength: 500 }),
  status: fc.constant('active'),
  updatedAt: fc.option(fc.constant('2024-01-01T00:00:00Z'), { nil: undefined }),
})

describe('Property 7: ListingCard renders all required visible fields for any listing', () => {
  it('always renders price with ₱ symbol, location, type, and correct /listings link', () => {
    fc.assert(
      fc.property(arbitraryListing, (listing) => {
        const { container } = render(React.createElement(ListingCard, { listing }))

        // Type must appear
        const hasType = container.textContent?.includes(listing.type) ?? false

        // Location must appear (village + location or just location)
        const hasLocation = container.textContent?.includes(listing.location) ?? false

        // Price: if non-null, must have ₱ symbol; if null, must show "Price on request"
        const textContent = container.textContent ?? ''
        const hasPrice = listing.price !== null
          ? textContent.includes('₱')
          : textContent.includes('Price on request')

        // "View Details" link must point to /listings/${displayId}
        const viewDetailsLink = container.querySelector(`a[href="/listings/${listing.displayId}"]`)
        const hasCorrectLink = viewDetailsLink !== null

        return hasType && hasLocation && hasPrice && hasCorrectLink
      }),
      { numRuns: 200 }
    )
  })

  it('shows placeholder when previewPhoto is null', () => {
    fc.assert(
      fc.property(
        arbitraryListing.map(l => ({ ...l, previewPhoto: null })),
        (listing) => {
          const { container } = render(React.createElement(ListingCard, { listing }))
          // No img tag with a real src should appear (only the SVG placeholder)
          const img = container.querySelector('img')
          return img === null || !img.getAttribute('src')?.startsWith('http')
        }
      ),
      { numRuns: 200 }
    )
  })
})
