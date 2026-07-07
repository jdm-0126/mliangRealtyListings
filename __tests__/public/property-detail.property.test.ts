/**
 * Property 9: Property detail page renders all non-null fields for any listing
 * Validates: Requirements 4.3
 *
 * Uses PropertyDetailView — a testable pure display component that accepts a
 * PublicListing prop and renders all conditional fields. The Next.js server
 * component at app/(public)/listings/[id]/page.tsx cannot be rendered directly
 * in Jest because it performs async data fetching; PropertyDetailView
 * encapsulates the display logic without any server-side concerns.
 */

import * as fc from 'fast-check'
import { render } from '@testing-library/react'
import React from 'react'

// Mock next/image — Next.js Image is not compatible with jsdom
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement('img', { src, alt }),
}))

// Mock next/link — avoid next/navigation dependency in jsdom
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => React.createElement('a', { href, ...rest }, children),
}))

import PropertyDetailView from '../../app/(public)/components/PropertyDetailView'
import type { PublicListing } from '../../lib/types/public'

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A non-empty, trimmed string — models fields that are only rendered when non-empty */
const nonEmptyString = fc.string({ minLength: 1, maxLength: 80 }).map((s) => s.trim()).filter((s) => s.length > 0)

/** Numeric value for areas / bedrooms / bathrooms */
const positiveInt = fc.integer({ min: 1, max: 9999 })

/** Valid photo URL */
const photoUrl = fc.constant('https://example.com/photo.jpg')

/**
 * Arbitrary PublicListing with optional fields independently nullable.
 * price, lotArea, floorArea, bedrooms, bathrooms can be null or a positive number.
 * type and notes can be empty (rendered only when non-empty).
 */
const arbitraryListing: fc.Arbitrary<PublicListing> = fc.record<PublicListing>({
  id: fc.integer({ min: 1, max: 9999 }),
  displayId: fc.integer({ min: 1, max: 9999 }),
  type: fc.oneof(fc.constant(''), nonEmptyString),
  location: nonEmptyString,
  village: fc.option(nonEmptyString, { nil: undefined }),
  price: fc.option(positiveInt, { nil: null }),
  lotArea: fc.option(positiveInt, { nil: null }),
  floorArea: fc.option(positiveInt, { nil: null }),
  bedrooms: fc.option(positiveInt, { nil: null }),
  bathrooms: fc.option(positiveInt, { nil: null }),
  previewPhoto: fc.option(photoUrl, { nil: null }),
  photos: fc.array(photoUrl, { maxLength: 5 }),
  notes: fc.oneof(fc.constant(''), nonEmptyString),
  status: fc.constant('active'),
  updatedAt: fc.option(fc.constant('2024-01-01T00:00:00Z'), { nil: undefined }),
})

// ---------------------------------------------------------------------------
// Property 9
// ---------------------------------------------------------------------------

describe('Property 9: PropertyDetailView renders all non-null fields for any listing', () => {
  it('renders every non-null optional field and omits null fields without error', () => {
    fc.assert(
      fc.property(arbitraryListing, (listing) => {
        // Should not throw
        const { container } = render(
          React.createElement(PropertyDetailView, { listing }),
        )

        const text = container.textContent ?? ''

        // ── Location is always shown ──────────────────────────────────────────
        // The component builds `address` from village + location (if village present)
        // so at minimum `listing.location` must appear in the DOM.
        if (!text.includes(listing.location)) return false

        // ── Type badge (rendered only when non-empty) ─────────────────────────
        const typeTrimmed = listing.type.trim()
        if (typeTrimmed !== '') {
          const typeEl = container.querySelector('[data-testid="property-type"]')
          if (!typeEl) return false
        }

        // ── Price ─────────────────────────────────────────────────────────────
        if (listing.price !== null) {
          // ₱ symbol must appear somewhere in the text
          if (!text.includes('₱')) return false
          // The price-on-request text must NOT appear
          if (text.includes('Price on request')) return false
        } else {
          // When price is null, "Price on request" must appear
          if (!text.includes('Price on request')) return false
        }

        // ── Lot area ──────────────────────────────────────────────────────────
        if (listing.lotArea !== null) {
          const el = container.querySelector('[data-testid="property-lot-area"]')
          if (!el) return false
        } else {
          // null lot area must NOT cause an element to appear
          const el = container.querySelector('[data-testid="property-lot-area"]')
          if (el) return false
        }

        // ── Floor area ────────────────────────────────────────────────────────
        if (listing.floorArea !== null) {
          const el = container.querySelector('[data-testid="property-floor-area"]')
          if (!el) return false
        } else {
          const el = container.querySelector('[data-testid="property-floor-area"]')
          if (el) return false
        }

        // ── Bedrooms ──────────────────────────────────────────────────────────
        if (listing.bedrooms !== null) {
          const el = container.querySelector('[data-testid="property-bedrooms"]')
          if (!el) return false
        } else {
          const el = container.querySelector('[data-testid="property-bedrooms"]')
          if (el) return false
        }

        // ── Bathrooms ─────────────────────────────────────────────────────────
        if (listing.bathrooms !== null) {
          const el = container.querySelector('[data-testid="property-bathrooms"]')
          if (!el) return false
        } else {
          const el = container.querySelector('[data-testid="property-bathrooms"]')
          if (el) return false
        }

        // ── Notes (rendered only when non-empty) ──────────────────────────────
        const notesTrimmed = (listing.notes ?? '').trim()
        if (notesTrimmed !== '') {
          const el = container.querySelector('[data-testid="property-notes"]')
          if (!el) return false
          if (!(el.textContent ?? '').includes(notesTrimmed)) return false
        } else {
          const el = container.querySelector('[data-testid="property-notes"]')
          if (el) return false
        }

        return true
      }),
      { numRuns: 200 },
    )
  })

  it('always renders the "Contact About This Property" link', () => {
    fc.assert(
      fc.property(arbitraryListing, (listing) => {
        const { container } = render(
          React.createElement(PropertyDetailView, { listing }),
        )

        const contactLink = container.querySelector('[data-testid="contact-cta"]')
        if (!contactLink) return false

        // Link text must be present
        const linkText = contactLink.textContent ?? ''
        if (!linkText.includes('Contact About This Property')) return false

        // href must point to /contact with a query param
        const href = contactLink.getAttribute('href') ?? ''
        if (!href.startsWith('/contact?property=')) return false

        return true
      }),
      { numRuns: 200 },
    )
  })

  it('contact link href encodes the full address', () => {
    fc.assert(
      fc.property(arbitraryListing, (listing) => {
        const { container } = render(
          React.createElement(PropertyDetailView, { listing }),
        )

        const contactLink = container.querySelector('[data-testid="contact-cta"]')
        if (!contactLink) return false

        const href = contactLink.getAttribute('href') ?? ''
        // The address comprises village (if present) and location
        const expectedAddress = listing.village
          ? `${listing.village}, ${listing.location}`
          : listing.location
        const expectedParam = encodeURIComponent(expectedAddress)

        return href === `/contact?property=${expectedParam}`
      }),
      { numRuns: 200 },
    )
  })
})
