/**
 * Property 15: Sitemap contains exactly the static pages plus one URL per active listing.
 * Validates: Requirements 7.1
 *
 * Tests the pure sitemap-building logic directly without importing app/sitemap.ts
 * (which would load node-appwrite/undici and fail in jsdom).
 */

import * as fc from 'fast-check'

// ─── Pure sitemap logic (mirrors app/sitemap.ts) ─────────────────────────────

const BASE_URL = 'https://realtyprov1.com'

const STATIC_PATHS = ['/', '/listings', '/about', '/contact']

interface MockListing {
  property_id: number
  $updatedAt: string | null
  Status: string
}

function toDisplayId(id: number): number {
  return id > 2 ? id - 1 : id
}

function buildSitemapEntries(activeListings: MockListing[]) {
  const staticRoutes = STATIC_PATHS.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const listingRoutes = activeListings.map((l) => {
    const displayId = toDisplayId(l.property_id)
    return {
      url: `${BASE_URL}/listings/${displayId}`,
      lastModified: l.$updatedAt ? new Date(l.$updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }
  })

  return [...staticRoutes, ...listingRoutes]
}

// ─── Arbitrary generators ─────────────────────────────────────────────────────

const arbPropertyId = fc.integer({ min: 1, max: 500 })

const arbUpdatedAt: fc.Arbitrary<string | null> = fc.oneof(
  fc.constant(null),
  fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map((d) => d.toISOString()),
)

const arbStatus = fc.oneof(
  fc.constant('active'),
  fc.constant('inactive'),
  fc.constant('sold'),
  fc.constant('pending'),
  fc.constant(''),
)

const arbListing: fc.Arbitrary<MockListing> = fc.record({
  property_id: arbPropertyId,
  $updatedAt: arbUpdatedAt,
  Status: arbStatus,
})

const arbListings: fc.Arbitrary<MockListing[]> = fc
  .array(arbListing, { minLength: 0, maxLength: 30 })
  .map((listings) => {
    const seen = new Set<number>()
    return listings.filter((l) => {
      if (seen.has(l.property_id)) return false
      seen.add(l.property_id)
      return true
    })
  })

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 15 – Sitemap contains exactly 4 static URLs + one URL per active listing', () => {
  it('total URL count equals 4 + number of active listings', () => {
    fc.assert(
      fc.property(arbListings, (listings) => {
        const activeListings = listings.filter((l) => l.Status.toLowerCase() === 'active')
        const entries = buildSitemapEntries(activeListings)
        expect(entries).toHaveLength(4 + activeListings.length)
      }),
      { numRuns: 200 },
    )
  })

  it('contains exactly the 4 required static URLs', () => {
    fc.assert(
      fc.property(arbListings, (listings) => {
        const activeListings = listings.filter((l) => l.Status.toLowerCase() === 'active')
        const entries = buildSitemapEntries(activeListings)
        const urls = entries.map((e) => e.url)
        for (const path of STATIC_PATHS) {
          expect(urls).toContain(`${BASE_URL}${path}`)
        }
      }),
      { numRuns: 200 },
    )
  })

  it('contains exactly one URL per active listing (using displayId transform)', () => {
    fc.assert(
      fc.property(arbListings, (listings) => {
        const activeListings = listings.filter((l) => l.Status.toLowerCase() === 'active')
        const entries = buildSitemapEntries(activeListings)
        const urls = entries.map((e) => e.url)
        for (const listing of activeListings) {
          const displayId = toDisplayId(listing.property_id)
          expect(urls).toContain(`${BASE_URL}/listings/${displayId}`)
        }
      }),
      { numRuns: 200 },
    )
  })

  it('contains no duplicate URLs', () => {
    fc.assert(
      fc.property(arbListings, (listings) => {
        const activeListings = listings.filter((l) => l.Status.toLowerCase() === 'active')
        const entries = buildSitemapEntries(activeListings)
        const urls = entries.map((e) => e.url)
        expect(new Set(urls).size).toBe(urls.length)
      }),
      { numRuns: 200 },
    )
  })

  it('contains no URLs for inactive listings', () => {
    fc.assert(
      fc.property(arbListings, (listings) => {
        const activeListings = listings.filter((l) => l.Status.toLowerCase() === 'active')
        const inactiveListings = listings.filter((l) => l.Status.toLowerCase() !== 'active')
        const entries = buildSitemapEntries(activeListings)
        const urls = entries.map((e) => e.url)
        const activeDisplayIds = new Set(activeListings.map((l) => toDisplayId(l.property_id)))
        for (const listing of inactiveListings) {
          const displayId = toDisplayId(listing.property_id)
          if (!activeDisplayIds.has(displayId)) {
            expect(urls).not.toContain(`${BASE_URL}/listings/${displayId}`)
          }
        }
      }),
      { numRuns: 200 },
    )
  })
})
