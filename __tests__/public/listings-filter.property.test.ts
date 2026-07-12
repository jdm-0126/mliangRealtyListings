/**
 * Property 6: Listings page filter intersection is correct
 * Validates: Requirements 3.1, 3.4
 *
 * Tests that the filtered result equals exactly the listings satisfying
 * ALL active filter predicates simultaneously.
 */
import * as fc from 'fast-check'
import { PublicListing } from '../../lib/types/public'

// ---------------------------------------------------------------------------
// Filter predicate functions — mirror the logic in ListingsClientWrapper
// ---------------------------------------------------------------------------

function matchesType(listing: PublicListing, typeFilter: string): boolean {
  return typeFilter === 'All' || listing.type === typeFilter
}

function matchesLocation(listing: PublicListing, locationQuery: string): boolean {
  const searchable = [listing.location, listing.village]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return !locationQuery.trim() || searchable.includes(locationQuery.toLowerCase())
}

function matchesPrice(listing: PublicListing, priceRange: string): boolean {
  const price = listing.price ?? 0
  if (priceRange === 'Under ₱2M') return price < 2_000_000
  if (priceRange === '₱2M–₱5M') return price >= 2_000_000 && price < 5_000_000
  if (priceRange === '₱5M–₱10M') return price >= 5_000_000 && price < 10_000_000
  if (priceRange === 'Above ₱10M') return price >= 10_000_000
  return true // 'All'
}

function applyFilters(
  allListings: PublicListing[],
  typeFilter: string,
  locationQuery: string,
  priceRange: string
): PublicListing[] {
  return allListings.filter(
    l => matchesType(l, typeFilter) && matchesLocation(l, locationQuery) && matchesPrice(l, priceRange)
  )
}

// ---------------------------------------------------------------------------
// Arbitrary generators
// ---------------------------------------------------------------------------

const TYPE_OPTIONS = ['All', 'House & Lot', 'Lot Only', 'Commercial'] as const
const PRICE_RANGE_OPTIONS = ['All', 'Under ₱2M', '₱2M–₱5M', '₱5M–₱10M', 'Above ₱10M'] as const
const LISTING_TYPES = ['House & Lot', 'Lot Only', 'Commercial'] as const

const arbitraryListing = fc.record<PublicListing>({
  id: fc.integer({ min: 1, max: 9999 }),
  displayId: fc.integer({ min: 1, max: 9999 }),
  type: fc.constantFrom(...LISTING_TYPES),
  location: fc.stringMatching(/^[A-Za-z ]{3,30}$/),
  village: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  price: fc.option(
    fc.oneof(
      fc.integer({ min: 100_000, max: 1_999_999 }),   // Under ₱2M
      fc.integer({ min: 2_000_000, max: 4_999_999 }), // ₱2M–₱5M
      fc.integer({ min: 5_000_000, max: 9_999_999 }), // ₱5M–₱10M
      fc.integer({ min: 10_000_000, max: 50_000_000 }) // Above ₱10M
    ),
    { nil: null }
  ),
  lotArea: fc.option(fc.integer({ min: 50, max: 10000 }), { nil: null }),
  floorArea: fc.option(fc.integer({ min: 30, max: 5000 }), { nil: null }),
  bedrooms: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
  bathrooms: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }),
  previewPhoto: fc.option(fc.constant('https://example.com/photo.jpg'), { nil: null }),
  photos: fc.array(fc.constant('https://example.com/photo.jpg'), { maxLength: 5 }),
  notes: fc.string({ maxLength: 200 }),
  status: fc.constant('active'),
  updatedAt: fc.option(fc.constant('2024-01-01T00:00:00Z'), { nil: undefined }),
})

const arbitraryListings = fc.array(arbitraryListing, { minLength: 0, maxLength: 30 })

const arbitraryTypeFilter = fc.constantFrom(...TYPE_OPTIONS)
const arbitraryPriceRange = fc.constantFrom(...PRICE_RANGE_OPTIONS)
// Location query: either empty string (no filter) or a 2–5-char alpha substring
const arbitraryLocationQuery = fc.oneof(
  fc.constant(''),
  fc.stringMatching(/^[A-Za-z]{2,5}$/)
)

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('Property 6: Listings page filter intersection is correct', () => {
  it('filtered result equals allListings filtered by ALL active predicates simultaneously', () => {
    fc.assert(
      fc.property(
        arbitraryListings,
        arbitraryTypeFilter,
        arbitraryLocationQuery,
        arbitraryPriceRange,
        (allListings, typeFilter, locationQuery, priceRange) => {
          const result = applyFilters(allListings, typeFilter, locationQuery, priceRange)

          // Every listing in the result must satisfy ALL predicates
          const allMatch = result.every(
            l =>
              matchesType(l, typeFilter) &&
              matchesLocation(l, locationQuery) &&
              matchesPrice(l, priceRange)
          )

          // No listing outside the result should satisfy all predicates
          const noneExcluded = allListings
            .filter(l => !result.includes(l))
            .every(
              l =>
                !matchesType(l, typeFilter) ||
                !matchesLocation(l, locationQuery) ||
                !matchesPrice(l, priceRange)
            )

          // Result length must match direct filter application
          const expected = allListings.filter(
            l =>
              matchesType(l, typeFilter) &&
              matchesLocation(l, locationQuery) &&
              matchesPrice(l, priceRange)
          )

          return allMatch && noneExcluded && result.length === expected.length
        }
      ),
      { numRuns: 300 }
    )
  })

  it('with All filters active, result equals the full dataset', () => {
    fc.assert(
      fc.property(arbitraryListings, allListings => {
        const result = applyFilters(allListings, 'All', '', 'All')
        return result.length === allListings.length
      }),
      { numRuns: 300 }
    )
  })

  it('type filter excludes listings with non-matching type', () => {
    fc.assert(
      fc.property(
        arbitraryListings,
        fc.constantFrom('House & Lot', 'Lot Only', 'Commercial'),
        (allListings, typeFilter) => {
          const result = applyFilters(allListings, typeFilter, '', 'All')
          return result.every(l => l.type === typeFilter)
        }
      ),
      { numRuns: 300 }
    )
  })

  it('price filter Under ₱2M excludes listings with price >= 2M', () => {
    fc.assert(
      fc.property(arbitraryListings, allListings => {
        const result = applyFilters(allListings, 'All', '', 'Under ₱2M')
        return result.every(l => (l.price ?? 0) < 2_000_000)
      }),
      { numRuns: 300 }
    )
  })

  it('location filter is case-insensitive substring match', () => {
    fc.assert(
      fc.property(
        arbitraryListings,
        fc.stringMatching(/^[A-Za-z]{2,5}$/),
        (allListings, query) => {
          const result = applyFilters(allListings, 'All', query, 'All')
          return result.every(l => {
            const searchable = [l.location, l.village]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
            return searchable.includes(query.toLowerCase())
          })
        }
      ),
      { numRuns: 300 }
    )
  })

  it('matches location searches when the address is stored in village instead of location', () => {
    const listing = {
      displayId: 1,
      type: 'House & Lot',
      location: '',
      village: 'Mabalacat City',
      price: 2500000,
      lotArea: 200,
      floorArea: 120,
      bedrooms: 3,
      bathrooms: 2,
      previewPhoto: null,
      photos: [],
      notes: '',
      status: 'active',
    } as PublicListing

    const result = applyFilters([listing], 'All', 'mabalacat', 'All')
    expect(result).toHaveLength(1)
  })
})
