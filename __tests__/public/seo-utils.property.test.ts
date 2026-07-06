/**
 * Property-based tests for SEO utilities
 *
 * Property 10: Detail page title format is always "{Type} in {Location} – M. Liang Realty"
 * Property 16: Canonical URL builder always produces a valid absolute URL
 * Property 17: LocalBusiness JSON-LD always contains all required schema fields
 *
 * Validates: Requirements 4.5, 7.3, 7.4
 */
import * as fc from 'fast-check'
import {
  generateDetailTitle,
  buildCanonicalUrl,
  buildLocalBusinessJsonLd,
} from '../../lib/seo/jsonld'
import type { TenantSettings } from '../../lib/types/public'

// ---------------------------------------------------------------------------
// Property 10: Detail page title format
// ---------------------------------------------------------------------------

describe('Property 10: Detail page title format is always "{Type} in {Location} – M. Liang Realty"', () => {
  /**
   * Validates: Requirements 4.5
   *
   * For any property type string T and location string L,
   * generateDetailTitle(T, L) SHALL produce "${T} in ${L} – M. Liang Realty"
   * with no truncation, extra spaces, or missing components.
   */
  it('always produces the exact template for arbitrary type and location strings', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (type, location) => {
          const title = generateDetailTitle(type, location)
          const expected = `${type} in ${location} – M. Liang Realty`
          return title === expected
        }
      ),
      { numRuns: 200 }
    )
  })

  it('always ends with " – M. Liang Realty"', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (type, location) => {
        return generateDetailTitle(type, location).endsWith(' – M. Liang Realty')
      }),
      { numRuns: 200 }
    )
  })

  it('always contains the type and location substrings verbatim', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (type, location) => {
        const title = generateDetailTitle(type, location)
        return title.includes(type) && title.includes(location)
      }),
      { numRuns: 200 }
    )
  })
})

// ---------------------------------------------------------------------------
// Property 16: Canonical URL builder always produces a valid absolute URL
// ---------------------------------------------------------------------------

describe('Property 16: Canonical URL builder always produces a valid absolute URL', () => {
  /**
   * Validates: Requirements 7.3
   *
   * For any host and path strings, buildCanonicalUrl(host, path) SHALL return
   * a string starting with the scheme, containing no double-slashes beyond the
   * protocol "://", and matching /^https?:\/\/[^\/].*$/
   */

  // Use a fixed set of valid base hosts to avoid generating hosts without schemes
  const validHosts = fc.constantFrom(
    'https://realtyprov1.com',
    'https://example.com',
    'http://staging.realtyprov1.com',
    'https://realtyprov1.com/',
    'https://example.com///',
  )

  it('always starts with https:// or http://', () => {
    fc.assert(
      fc.property(validHosts, fc.string(), (host, path) => {
        const url = buildCanonicalUrl(host, path)
        return url.startsWith('https://') || url.startsWith('http://')
      }),
      { numRuns: 200 }
    )
  })

  it('matches the valid absolute URL pattern /^https?:\\/\\/[^\\/].*$/', () => {
    fc.assert(
      fc.property(validHosts, fc.string(), (host, path) => {
        const url = buildCanonicalUrl(host, path)
        return /^https?:\/\/[^/]/.test(url)
      }),
      { numRuns: 200 }
    )
  })

  it('never contains double-slashes beyond the protocol ://', () => {
    fc.assert(
      fc.property(validHosts, fc.string(), (host, path) => {
        const url = buildCanonicalUrl(host, path)
        // Strip the scheme (e.g. "https://") and check the rest has no "//"
        const afterScheme = url.replace(/^https?:\/\//, '')
        return !afterScheme.includes('//')
      }),
      { numRuns: 200 }
    )
  })

  it('always contains the host domain in the result', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'https://realtyprov1.com',
          'https://example.com',
          'http://staging.realtyprov1.com'
        ),
        fc.string(),
        (host, path) => {
          const url = buildCanonicalUrl(host, path)
          // Extract domain from host (strip scheme + trailing slashes)
          const domain = host.replace(/^https?:\/\//, '').replace(/\/+$/, '')
          return url.includes(domain)
        }
      ),
      { numRuns: 200 }
    )
  })
})

// ---------------------------------------------------------------------------
// Property 17: LocalBusiness JSON-LD always contains all required schema fields
// ---------------------------------------------------------------------------

describe('Property 17: LocalBusiness JSON-LD always contains all required schema fields', () => {
  /**
   * Validates: Requirements 7.4
   *
   * For any TenantSettings-shaped object, buildLocalBusinessJsonLd(settings)
   * SHALL return an object with:
   *   @context, @type: 'RealEstateAgent', name, telephone,
   *   address with addressLocality: 'San Fernando',
   *   addressRegion: 'Pampanga', and addressCountry: 'PH'
   */

  // Arbitrary TenantSettings generator
  const arbitraryTenantSettings: fc.Arbitrary<TenantSettings> = fc.record({
    businessName:  fc.string({ minLength: 1 }),
    brokerName:    fc.string({ minLength: 1 }),
    brokerTitle:   fc.string({ minLength: 1 }),
    prcNumber:     fc.string({ minLength: 1 }),
    officeAddress: fc.string({ minLength: 1 }),
    contactNumber: fc.string({ minLength: 1 }),
    emailAddress:  fc.string({ minLength: 1 }),
  })

  it('always includes @context', () => {
    fc.assert(
      fc.property(arbitraryTenantSettings, (settings) => {
        const jsonld = buildLocalBusinessJsonLd(settings) as Record<string, unknown>
        return '@context' in jsonld && typeof jsonld['@context'] === 'string' && jsonld['@context'].length > 0
      }),
      { numRuns: 200 }
    )
  })

  it('always has @type equal to "RealEstateAgent"', () => {
    fc.assert(
      fc.property(arbitraryTenantSettings, (settings) => {
        const jsonld = buildLocalBusinessJsonLd(settings) as Record<string, unknown>
        return jsonld['@type'] === 'RealEstateAgent'
      }),
      { numRuns: 200 }
    )
  })

  it('always includes name matching settings.businessName', () => {
    fc.assert(
      fc.property(arbitraryTenantSettings, (settings) => {
        const jsonld = buildLocalBusinessJsonLd(settings) as Record<string, unknown>
        return jsonld['name'] === settings.businessName
      }),
      { numRuns: 200 }
    )
  })

  it('always includes telephone matching settings.contactNumber', () => {
    fc.assert(
      fc.property(arbitraryTenantSettings, (settings) => {
        const jsonld = buildLocalBusinessJsonLd(settings) as Record<string, unknown>
        return jsonld['telephone'] === settings.contactNumber
      }),
      { numRuns: 200 }
    )
  })

  it('always includes address with addressLocality: "San Fernando", addressRegion: "Pampanga", addressCountry: "PH"', () => {
    fc.assert(
      fc.property(arbitraryTenantSettings, (settings) => {
        const jsonld = buildLocalBusinessJsonLd(settings) as Record<string, unknown>
        const address = jsonld['address'] as Record<string, unknown>
        if (!address || typeof address !== 'object') return false
        return (
          address['addressLocality'] === 'San Fernando' &&
          address['addressRegion']   === 'Pampanga' &&
          address['addressCountry']  === 'PH'
        )
      }),
      { numRuns: 200 }
    )
  })

  it('always includes all required top-level fields', () => {
    fc.assert(
      fc.property(arbitraryTenantSettings, (settings) => {
        const jsonld = buildLocalBusinessJsonLd(settings) as Record<string, unknown>
        const requiredFields = ['@context', '@type', 'name', 'telephone', 'address']
        return requiredFields.every(field => field in jsonld && jsonld[field] !== undefined && jsonld[field] !== null)
      }),
      { numRuns: 200 }
    )
  })
})
