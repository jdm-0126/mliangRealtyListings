/**
 * Property-Based Tests for selectFeaturedListings
 *
 * Property 3: Featured listings obey the "up to 6, newest first" invariant.
 * Validates: Requirements 2.2, 2.3
 */

import * as fc from 'fast-check'
import { selectFeaturedListings } from '@/lib/utils/listings'
import { PublicListing } from '@/lib/types/public'

const arbListing = fc.record<PublicListing>({
  id: fc.integer({ min: 1, max: 100_000 }),
  displayId: fc.integer({ min: 1, max: 100_000 }),
  type: fc.constantFrom('House & Lot', 'Lot Only', 'Commercial', 'Condo'),
  location: fc.string({ minLength: 1, maxLength: 50 }),
  village: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  price: fc.option(fc.integer({ min: 1_000_000, max: 50_000_000 }), { nil: null }),
  lotArea: fc.option(fc.integer({ min: 50, max: 5_000 }), { nil: null }),
  floorArea: fc.option(fc.integer({ min: 30, max: 2_000 }), { nil: null }),
  bedrooms: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
  bathrooms: fc.option(fc.integer({ min: 1, max: 8 }), { nil: null }),
  previewPhoto: fc.option(fc.webUrl(), { nil: null }),
  photos: fc.array(fc.webUrl(), { maxLength: 10 }),
  notes: fc.string({ maxLength: 500 }),
  status: fc.constant('active'),
  updatedAt: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
})

const arbListingArray = fc
  .array(arbListing, { minLength: 0, maxLength: 30 })
  .map((listings) => {
    const seen = new Set<number>()
    return listings.filter((l) => {
      if (seen.has(l.id!)) return false
      seen.add(l.id!)
      return true
    })
  })

test('Property A – result length equals Math.min(N, 6)', () => {
  fc.assert(
    fc.property(arbListingArray, (listings) => {
      const result = selectFeaturedListings(listings)
      expect(result).toHaveLength(Math.min(listings.length, 6))
    }),
    { numRuns: 200 },
  )
})

test('Property B – returned listings have the highest IDs', () => {
  fc.assert(
    fc.property(arbListingArray, (listings) => {
      const result = selectFeaturedListings(listings)
      if (listings.length === 0) return

      const resultIds = new Set(result.map((l) => l.id!))
      const excluded = listings.filter((l) => !resultIds.has(l.id!))
      const minResultId = Math.min(...result.map((l) => l.id!))

      excluded.forEach((l) => {
        expect(l.id!).toBeLessThan(minResultId)
      })
    }),
    { numRuns: 200 },
  )
})

test('Property C – result is ordered by ID descending (newest first)', () => {
  fc.assert(
    fc.property(arbListingArray, (listings) => {
      const result = selectFeaturedListings(listings)
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].id!).toBeGreaterThanOrEqual(result[i + 1].id!)
      }
    }),
    { numRuns: 200 },
  )
})

test('Property D – empty input returns empty array', () => {
  expect(selectFeaturedListings([])).toEqual([])
})

test('Property E – respects custom maxCount parameter', () => {
  fc.assert(
    fc.property(
      arbListingArray,
      fc.integer({ min: 1, max: 20 }),
      (listings, maxCount) => {
        const result = selectFeaturedListings(listings, maxCount)
        expect(result).toHaveLength(Math.min(listings.length, maxCount))
      },
    ),
    { numRuns: 200 },
  )
})
