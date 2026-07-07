/**
 * Property-Based Tests for selectFeaturedListings
 *
 * Property 3: Featured listings obey the "up to 6, newest first" invariant.
 * Validates: Requirements 2.2, 2.3
 */

import * as fc from 'fast-check'
import { selectFeaturedListings } from '@/lib/utils/listings'
import { PublicListing } from '@/lib/types/public'

// ---------------------------------------------------------------------------
// Arbitrary generator for PublicListing
// ---------------------------------------------------------------------------

/**
 * Generates a minimal valid PublicListing with a guaranteed unique-ish id.
 * We use fc.integer with a wide range so property tests explore varied id sets.
 */
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

/**
 * Generates an array of listings with DISTINCT ids (no duplicates),
 * so assertions about "highest IDs" are unambiguous.
 */
const arbListingArray = fc
  .array(arbListing, { minLength: 0, maxLength: 30 })
  .map((listings) => {
    // Deduplicate by id — keep the first occurrence of each id
    const seen = new Set<number>()
    return listings.filter((l) => {
      if (seen.has(l.id)) return false
      seen.add(l.id)
      return true
    })
  })

// ---------------------------------------------------------------------------
// Property A: result length equals Math.min(N, 6)
// ---------------------------------------------------------------------------

test(
  /**
   * **Validates: Requirements 2.2**
   * Property A: The number of returned listings is exactly min(N, 6)
   * for any array of N distinct active listings.
   */
  'Property A – result length equals Math.min(N, 6)',
  () => {
    fc.assert(
      fc.property(arbListingArray, (listings) => {
        const result = selectFeaturedListings(listings)
        expect(result).toHaveLength(Math.min(listings.length, 6))
      }),
      { numRuns: 200 },
    )
  },
)

// ---------------------------------------------------------------------------
// Property B: returned listings have the highest IDs
// ---------------------------------------------------------------------------

test(
  /**
   * **Validates: Requirements 2.2**
   * Property B: Every listing in the result has an id ≥ every id NOT in the result.
   * In other words, the result is the top-min(N,6) listings by id.
   */
  'Property B – returned listings have the highest IDs',
  () => {
    fc.assert(
      fc.property(arbListingArray, (listings) => {
        const result = selectFeaturedListings(listings)
        if (listings.length === 0) return // edge case handled by Property D

        const resultIds = new Set(result.map((l) => l.id))
        const excluded = listings.filter((l) => !resultIds.has(l.id))

        const minResultId = Math.min(...result.map((l) => l.id))

        // Every excluded listing must have an id lower than the minimum result id
        excluded.forEach((l) => {
          expect(l.id).toBeLessThan(minResultId)
        })
      }),
      { numRuns: 200 },
    )
  },
)

// ---------------------------------------------------------------------------
// Property C: result is ordered by ID descending
// ---------------------------------------------------------------------------

test(
  /**
   * **Validates: Requirements 2.2**
   * Property C: The result array is sorted by id in descending order (newest first).
   */
  'Property C – result is ordered by ID descending (newest first)',
  () => {
    fc.assert(
      fc.property(arbListingArray, (listings) => {
        const result = selectFeaturedListings(listings)

        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].id).toBeGreaterThanOrEqual(result[i + 1].id)
        }
      }),
      { numRuns: 200 },
    )
  },
)

// ---------------------------------------------------------------------------
// Property D: when N=0, result is empty array
// ---------------------------------------------------------------------------

test(
  /**
   * **Validates: Requirements 2.3**
   * Property D: When the input is empty (0 active listings),
   * the result is an empty array (the "No listings available" placeholder should render).
   */
  'Property D – empty input returns empty array',
  () => {
    const result = selectFeaturedListings([])
    expect(result).toEqual([])
    expect(result).toHaveLength(0)
  },
)

// ---------------------------------------------------------------------------
// Property E: respects custom maxCount parameter
// ---------------------------------------------------------------------------

test(
  /**
   * **Validates: Requirements 2.2**
   * Property E: The optional maxCount parameter is respected — result length
   * never exceeds maxCount regardless of input size.
   */
  'Property E – respects custom maxCount parameter',
  () => {
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
  },
)
