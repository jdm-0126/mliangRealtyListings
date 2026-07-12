// lib/utils/listings.ts
//
// Pure utility helpers for listing selection logic.
// These are intentionally framework-free so they can be unit/property-tested
// without setting up Next.js server-component infrastructure.

import { PublicListing } from '@/lib/types/public'

/**
 * selectFeaturedListings
 *
 * Given an array of active listings, returns the `min(N, maxCount)` listings
 * with the highest property_ids, ordered by ID descending (newest first).
 *
 * Rules:
 * - Empty input → empty output
 * - maxCount defaults to 6 (the homepage "Featured Listings" cap)
 * - When N ≤ maxCount every listing is returned, still sorted by id desc
 * - When N > maxCount only the top-maxCount highest-id listings are returned
 *
 * Validates: Requirements 2.2, 2.3
 */
export function selectFeaturedListings(
  listings: PublicListing[],
  maxCount = 6,
): PublicListing[] {
  if (listings.length === 0) return []

  // Sort by id descending, then take the first maxCount
  return [...listings]
    .sort((a, b) => (b.id ?? b.property_id ?? 0) - (a.id ?? a.property_id ?? 0))
    .slice(0, maxCount)
}
