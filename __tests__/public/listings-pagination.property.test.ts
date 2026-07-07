/**
 * Property 8: Pagination appears iff more than 12 listings match filters
 * Validates: Requirements 3.6
 *
 * Renders ListingsClientWrapper with N listings (all pass all filters)
 * and asserts pagination visibility matches N > 12, with page count = ceil(N/12).
 */
import * as fc from 'fast-check'
import { render, cleanup } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement('img', { src, alt }),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}))

jest.mock('../../app/(public)/components/ListingCard', () => ({
  __esModule: true,
  default: ({ listing }: { listing: { id: number } }) =>
    React.createElement('div', { 'data-testid': `listing-card-${listing.id}` }, `Card ${listing.id}`),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import ListingsClientWrapper from '../../app/(public)/components/ListingsClientWrapper'
import { PublicListing } from '../../lib/types/public'

// ---------------------------------------------------------------------------
// Pure pagination logic (mirrors ListingsClientWrapper internals)
// ---------------------------------------------------------------------------

const PAGE_SIZE = 12

function paginationVisible(totalMatchingListings: number): boolean {
  return totalMatchingListings > PAGE_SIZE
}

function pageCount(totalMatchingListings: number): number {
  return Math.ceil(totalMatchingListings / PAGE_SIZE)
}

// ---------------------------------------------------------------------------
// Helper: create N listings that pass all filters (type=All, location='', price=All)
// ---------------------------------------------------------------------------

function makeListings(n: number): PublicListing[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    displayId: i + 1,
    type: 'House & Lot',
    location: 'San Fernando',
    village: undefined,
    price: 3_000_000, // ₱2M–₱5M range, passes all filters
    lotArea: 120,
    floorArea: 80,
    bedrooms: 3,
    bathrooms: 2,
    previewPhoto: null,
    photos: [],
    notes: '',
    status: 'active',
    updatedAt: undefined,
  }))
}

// ---------------------------------------------------------------------------
// Property tests — pure logic (no rendering)
// ---------------------------------------------------------------------------

describe('Property 8: Pagination appears iff more than 12 listings match filters (pure logic)', () => {
  it('pagination is visible iff N > 12 for any N in [0, 200]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200 }),
        n => {
          return paginationVisible(n) === (n > PAGE_SIZE)
        }
      ),
      { numRuns: 200 }
    )
  })

  it('page count equals Math.ceil(N / 12) for any N > 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }),
        n => {
          return pageCount(n) === Math.ceil(n / PAGE_SIZE)
        }
      ),
      { numRuns: 200 }
    )
  })

  it('exactly 12 listings → pagination NOT visible', () => {
    expect(paginationVisible(12)).toBe(false)
  })

  it('13 listings → pagination visible with 2 pages', () => {
    expect(paginationVisible(13)).toBe(true)
    expect(pageCount(13)).toBe(2)
  })

  it('0 listings → pagination not visible', () => {
    expect(paginationVisible(0)).toBe(false)
  })

  it('24 listings → exactly 2 pages', () => {
    expect(paginationVisible(24)).toBe(true)
    expect(pageCount(24)).toBe(2)
  })

  it('25 listings → 3 pages', () => {
    expect(paginationVisible(25)).toBe(true)
    expect(pageCount(25)).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Rendering tests — use cleanup after each render to avoid DOM accumulation
// ---------------------------------------------------------------------------

describe('Property 8: Pagination rendering in ListingsClientWrapper', () => {
  afterEach(() => {
    cleanup()
  })

  it('pagination controls are visible iff N > 12 (rendered)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 60 }),
        n => {
          const listings = makeListings(n)
          const { container } = render(
            React.createElement(ListingsClientWrapper, { allListings: listings })
          )

          const prevButton = container.querySelector('[aria-label="Previous page"]')
          const nextButton = container.querySelector('[aria-label="Next page"]')
          const paginationIsVisible = prevButton !== null && nextButton !== null

          cleanup()

          return paginationIsVisible === (n > PAGE_SIZE)
        }
      ),
      { numRuns: 200 }
    )
  })

  it('page count equals Math.ceil(N / 12) when pagination is shown (rendered)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: PAGE_SIZE + 1, max: 60 }),
        n => {
          const listings = makeListings(n)
          const { container } = render(
            React.createElement(ListingsClientWrapper, { allListings: listings })
          )

          const expectedPageCount = Math.ceil(n / PAGE_SIZE)

          // Count page number buttons (aria-label="Page X")
          const allButtons = container.querySelectorAll('button')
          const pageButtons = Array.from(allButtons).filter(btn => {
            const label = btn.getAttribute('aria-label') ?? ''
            return /^Page \d+$/.test(label)
          })

          cleanup()

          return pageButtons.length === expectedPageCount
        }
      ),
      { numRuns: 200 }
    )
  })

  it('exactly 12 listings shows no pagination', () => {
    const listings = makeListings(12)
    const { container } = render(
      React.createElement(ListingsClientWrapper, { allListings: listings })
    )
    expect(container.querySelector('[aria-label="Previous page"]')).toBeNull()
    expect(container.querySelector('[aria-label="Next page"]')).toBeNull()
  })

  it('13 listings shows pagination with 2 pages', () => {
    const listings = makeListings(13)
    const { container } = render(
      React.createElement(ListingsClientWrapper, { allListings: listings })
    )
    expect(container.querySelector('[aria-label="Previous page"]')).not.toBeNull()
    expect(container.querySelector('[aria-label="Next page"]')).not.toBeNull()

    const allButtons = container.querySelectorAll('button')
    const pageButtons = Array.from(allButtons).filter(btn => {
      const label = btn.getAttribute('aria-label') ?? ''
      return /^Page \d+$/.test(label)
    })
    expect(pageButtons.length).toBe(2)
  })
})
