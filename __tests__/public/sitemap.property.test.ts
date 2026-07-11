/**
 * Property 15: Sitemap contains exactly the static pages plus one URL per active listing.
 * Validates: Requirements 7.1
 *
 * numRuns: 200
 */

import * as fc from 'fast-check'

// ─── Mock Supabase ────────────────────────────────────────────────────────────
jest.mock('@/app/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

// ─── Types ────────────────────────────────────────────────────────────────────

interface MockListing {
  'property_id': number
  updated_at: string | null
  Status: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Mirrors the displayId transform in app/sitemap.ts */
function toDisplayId(id: number): number {
  return id > 2 ? id - 1 : id
}

const STATIC_PATHS = ['/', '/listings', '/about', '/contact']

/** Configure the Supabase mock to return the given active listings. */
function mockSupabase(activeListings: MockListing[]) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { supabase } = require('@/app/lib/supabaseClient')
  ;(supabase.from as jest.Mock).mockReturnValue({
    select: jest.fn().mockReturnValue({
      ilike: jest.fn().mockResolvedValue({ data: activeListings, error: null }),
    }),
  })
}

// ─── Arbitrary generators ─────────────────────────────────────────────────────

/** Generates a positive integer suitable for use as a property_id (1–500). */
const arbPropertyId = fc.integer({ min: 1, max: 500 })

/** Generates an ISO date string or null for updated_at. */
const arbUpdatedAt: fc.Arbitrary<string | null> = fc.oneof(
  fc.constant(null),
  fc
    .date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
    .map((d) => d.toISOString()),
)

/** Generates a status value — either 'active' or something else. */
const arbStatus = fc.oneof(
  fc.constant('active'),
  fc.constant('inactive'),
  fc.constant('sold'),
  fc.constant('pending'),
  fc.constant(''),
)

/** Generates a single listing with a mixed status. */
const arbListing: fc.Arbitrary<MockListing> = fc.record({
  'property_id': arbPropertyId,
  updated_at: arbUpdatedAt,
  Status: arbStatus,
})

/**
 * Generates an array of listings with unique property_ids and mixed statuses.
 * Array length: 0–30 listings.
 */
const arbListings: fc.Arbitrary<MockListing[]> = fc
  .array(arbListing, { minLength: 0, maxLength: 30 })
  .map((listings) => {
    // Deduplicate by property_id to avoid ambiguous URL expectations
    const seen = new Set<number>()
    return listings.filter((l) => {
      if (seen.has(l['property_id'])) return false
      seen.add(l['property_id'])
      return true
    })
  })

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 15 – Sitemap contains exactly 4 static URLs + one URL per active listing', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('total URL count equals 4 + number of active listings', async () => {
    await fc.assert(
      fc.asyncProperty(arbListings, async (listings) => {
        const activeListings = listings.filter(
          (l) => l.Status.toLowerCase() === 'active',
        )

        mockSupabase(activeListings)

        // Re-require sitemap after mock is set so it picks up the current mock
        jest.resetModules()
        jest.mock('@/app/lib/supabaseClient', () => ({
          supabase: {
            from: jest.fn(),
          },
        }))
        mockSupabase(activeListings)

        const { default: sitemap } = await import('@/app/sitemap')
        const entries = await sitemap()

        expect(entries).toHaveLength(4 + activeListings.length)
      }),
      { numRuns: 200 },
    )
  })

  it('contains exactly the 4 required static URLs', async () => {
    await fc.assert(
      fc.asyncProperty(arbListings, async (listings) => {
        const activeListings = listings.filter(
          (l) => l.Status.toLowerCase() === 'active',
        )

        jest.resetModules()
        jest.mock('@/app/lib/supabaseClient', () => ({
          supabase: { from: jest.fn() },
        }))
        mockSupabase(activeListings)

        const { default: sitemap } = await import('@/app/sitemap')
        const entries = await sitemap()
        const urls = entries.map((e) => e.url)

        for (const path of STATIC_PATHS) {
          expect(urls).toContain(`https://realtyprov1.com${path}`)
        }
      }),
      { numRuns: 200 },
    )
  })

  it('contains exactly one URL per active listing (using displayId transform)', async () => {
    await fc.assert(
      fc.asyncProperty(arbListings, async (listings) => {
        const activeListings = listings.filter(
          (l) => l.Status.toLowerCase() === 'active',
        )

        jest.resetModules()
        jest.mock('@/app/lib/supabaseClient', () => ({
          supabase: { from: jest.fn() },
        }))
        mockSupabase(activeListings)

        const { default: sitemap } = await import('@/app/sitemap')
        const entries = await sitemap()
        const urls = entries.map((e) => e.url)

        for (const listing of activeListings) {
          const displayId = toDisplayId(listing['property_id'])
          const expectedUrl = `https://realtyprov1.com/listings/${displayId}`
          expect(urls).toContain(expectedUrl)
        }
      }),
      { numRuns: 200 },
    )
  })

  it('contains no duplicate URLs', async () => {
    await fc.assert(
      fc.asyncProperty(arbListings, async (listings) => {
        const activeListings = listings.filter(
          (l) => l.Status.toLowerCase() === 'active',
        )

        jest.resetModules()
        jest.mock('@/app/lib/supabaseClient', () => ({
          supabase: { from: jest.fn() },
        }))
        mockSupabase(activeListings)

        const { default: sitemap } = await import('@/app/sitemap')
        const entries = await sitemap()
        const urls = entries.map((e) => e.url)
        const uniqueUrls = new Set(urls)

        expect(uniqueUrls.size).toBe(urls.length)
      }),
      { numRuns: 200 },
    )
  })

  it('contains no URLs for inactive listings', async () => {
    await fc.assert(
      fc.asyncProperty(arbListings, async (listings) => {
        const activeListings = listings.filter(
          (l) => l.Status.toLowerCase() === 'active',
        )
        const inactiveListings = listings.filter(
          (l) => l.Status.toLowerCase() !== 'active',
        )

        jest.resetModules()
        jest.mock('@/app/lib/supabaseClient', () => ({
          supabase: { from: jest.fn() },
        }))
        mockSupabase(activeListings)

        const { default: sitemap } = await import('@/app/sitemap')
        const entries = await sitemap()
        const urls = entries.map((e) => e.url)

        for (const listing of inactiveListings) {
          const displayId = toDisplayId(listing['property_id'])
          const inactiveUrl = `https://realtyprov1.com/listings/${displayId}`
          // Only assert absence if the inactive listing's displayId is not
          // also claimed by an active listing (avoids false failures when two
          // listings share the same computed displayId after the transform)
          const activeDisplayIds = new Set(
            activeListings.map((l) => toDisplayId(l['property_id'])),
          )
          if (!activeDisplayIds.has(displayId)) {
            expect(urls).not.toContain(inactiveUrl)
          }
        }
      }),
      { numRuns: 200 },
    )
  })
})
