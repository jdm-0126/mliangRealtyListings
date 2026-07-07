// lib/seo/jsonld.ts

import { TenantSettings, PublicListing } from '../types/public'

/**
 * Generates the canonical detail page title for a property.
 * Format: "{type} in {location} – M. Liang Realty"
 *
 * Requirements: 4.5 (Property 10)
 */
export function generateDetailTitle(type: string, location: string): string {
  return `${type} in ${location} – M. Liang Realty`
}

/**
 * Builds a valid absolute URL from a host and a path, ensuring no double-slashes.
 *
 * Examples:
 *   buildCanonicalUrl('https://realtyprov1.com', '/listings')  → 'https://realtyprov1.com/listings'
 *   buildCanonicalUrl('https://realtyprov1.com/', '/listings') → 'https://realtyprov1.com/listings'
 *   buildCanonicalUrl('https://realtyprov1.com', 'listings')   → 'https://realtyprov1.com/listings'
 *
 * Requirements: 7.3
 */
export function buildCanonicalUrl(host: string, path: string): string {
  const normalizedHost = host.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedHost}${normalizedPath}`
}

/**
 * Builds a JSON-LD object for the RealEstateAgent (LocalBusiness) schema.
 * Used on the public homepage to satisfy requirement 7.4.
 */
export function buildLocalBusinessJsonLd(settings: TenantSettings): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: settings.businessName,
    telephone: settings.contactNumber,
    email: settings.emailAddress,
    url: 'https://realtyprov1.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.officeAddress,
      addressLocality: 'San Fernando',
      addressRegion: 'Pampanga',
      addressCountry: 'PH',
    },
  }
}

/**
 * Builds a JSON-LD object for the RealEstateListing schema.
 * Used on individual property detail pages to satisfy requirement 4.5.
 */
export function buildRealEstateListingJsonLd(listing: PublicListing): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: `${listing.type} in ${listing.location}`,
    description: listing.notes,
    url: `https://realtyprov1.com/listings/${listing.displayId}`,
    image: listing.previewPhoto ?? undefined,
    offers: {
      '@type': 'Offer',
      price: listing.price ?? undefined,
      priceCurrency: 'PHP',
      availability: 'https://schema.org/InStock',
    },
  }
}
