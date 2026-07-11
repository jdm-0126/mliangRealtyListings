import { supabase } from '@/app/lib/supabaseClient'
import { PublicListing } from '@/lib/types/public'

function parsePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
  return isNaN(n) || n <= 0 ? null : n
}

function parseArea(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
  return isNaN(n) || n <= 0 ? null : n
}

function mapToPublicListing(row: Record<string, unknown>): PublicListing {
  const id = Number(row['property_id'])
  const photos: string[] = []
  for (let i = 1; i <= 20; i++) {
    const photo = row[`Photo ${i}`]
    if (typeof photo === 'string' && photo.trim()) photos.push(photo.trim())
  }

  return {
    property_id: id,
    displayId: id > 2 ? id - 1 : id,
    type: String(row['Type'] ?? ''),
    location: String(row['Location'] ?? ''),
    village: typeof row['Village'] === 'string' ? row['Village'] : undefined,
    price: parsePrice(row['Listing Price'] ?? row['ListingPrice'] ?? row['Price']),
    lotArea: parseArea(row['Lot Area'] ?? row['Lot Area sqm'] ?? row['LA']),
    floorArea: parseArea(row['Floor Area'] ?? row['Floor Area sqm']),
    bedrooms: parseArea(row['Bedroom']),
    bathrooms: parseArea(row['Bathroom']),
    previewPhoto: typeof row['Preview Photo'] === 'string' && row['Preview Photo'].trim() ? row['Preview Photo'].trim() : null,
    photos,
    notes: String(row['Notes'] ?? ''),
    status: String(row['Status'] ?? ''),
    mapUrl: typeof row['Map URL'] === 'string' && row['Map URL'].trim() ? row['Map URL'].trim() : null,
    videoUrl: typeof row['Video URL'] === 'string' && row['Video URL'].trim() ? row['Video URL'].trim() : null,
    facebookVideoUrl: typeof row['Facebook Video URL'] === 'string' && row['Facebook Video URL'].trim() ? row['Facebook Video URL'].trim() : null,
    tiktokVideoUrl: typeof row['TikTok Video URL'] === 'string' && row['TikTok Video URL'].trim() ? row['TikTok Video URL'].trim() : null,
    featured: row['featured'] === true,
    listingMode: typeof row['Listing Mode'] === 'string' ? row['Listing Mode'].trim() : undefined,
    updatedAt: typeof row['updated_at'] === 'string' ? row['updated_at'] : undefined,
  }
}

export async function getCachedPublicListings(): Promise<PublicListing[]> {
  return fetchListings(false)
}

/**
 * Fetches only listings where featured=true, ordered newest first.
 * Uses the partial index idx_mlianglistings_featured — fast even with 300+ rows.
 * Falls back to the 6 newest active listings if none are flagged featured.
 */
export async function getFeaturedListings(): Promise<PublicListing[]> {
  if (!supabase) return []
  const KEEP = new Set([
    'property_id', 'Type', 'Location', 'Village',
    'Listing Price', 'ListingPrice', 'Price',
    'Lot Area', 'Lot Area sqm', 'LA',
    'Floor Area', 'Floor Area sqm',
    'Bedroom', 'Bathroom',
    'Preview Photo',
    'Status', 'Map URL', 'featured',
  ])

  // Primary: explicitly flagged featured listings
  const { data: featuredData } = await supabase
    .from('mlianglistings')
    .select('*')
    .ilike('Status', 'active')
    .eq('featured', true)
    .order('property_id', { ascending: false })
    .limit(6)

  const featured = Array.isArray(featuredData) && featuredData.length > 0
    ? featuredData as Array<Record<string, unknown>>
    : null

  // Fallback: newest 6 active listings with a photo or price
  if (!featured) {
    const { data: fallbackData } = await supabase
      .from('mlianglistings')
      .select('*')
      .ilike('Status', 'active')
      .order('property_id', { ascending: false })
      .limit(6) // fetch 6, filter to 6 with photo/price

    const rows = Array.isArray(fallbackData)
      ? (fallbackData as Array<Record<string, unknown>>)
      : []

    return rows
      .map(rawRow => {
        const row: Record<string, unknown> = {}
        for (const key of KEEP) { if (key in rawRow) row[key] = rawRow[key] }
        return mapToPublicListing(row)
      })
      .filter(l => l.price !== null || l.previewPhoto !== null)
      .slice(0, 6)
  }

  return featured
    .map(rawRow => {
      const row: Record<string, unknown> = {}
      for (const key of KEEP) { if (key in rawRow) row[key] = rawRow[key] }
      return mapToPublicListing(row)
    })
    .filter(l => l.price !== null || l.previewPhoto !== null)
}

/**
 * Slim variant for the all-listings browse page.
 * Omits notes, full photo array, and video URLs — only the card-level fields.
 * Keeps the payload well under Vercel's 19 MB ISR limit even with 300+ listings.
 */
export async function getSlimPublicListings(): Promise<PublicListing[]> {
  return fetchListings(true)
}

async function fetchListings(slim: boolean): Promise<PublicListing[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('mlianglistings')
    .select(`property_id, location`)
    .ilike('Status', 'active')
    .order('property_id', { ascending: false })
    .range(0,23)
    .limit(300)

  if (error) {
    console.error('[publicListings] fetch error:', error.message)
    return []
  }

  const KEEP_FULL = new Set([
    'property_id', 'Type', 'Location', 'Village',
    'Listing Price', 'ListingPrice', 'Price',
    'Lot Area', 'Lot Area sqm', 'LA',
    'Floor Area', 'Floor Area sqm',
    'Bedroom', 'Bathroom',
    'Preview Photo',
    'Photo 1', 'Photo 2', 'Photo 3', 'Photo 4', 'Photo 5', 'Photo 6',
    'Notes', 'Status', 'Map URL', 'Video URL', 'Facebook Video URL', 'TikTok Video URL', 'updated_at', 'featured',
  ])

  // Slim: card-level fields only — no notes, no full photo array, no video URLs
  const KEEP_SLIM = new Set([
    'property_id', 'Type', 'Location', 'Village',
    'Listing Price', 'ListingPrice', 'Price',
    'Lot Area', 'Lot Area sqm', 'LA',
    'Floor Area', 'Floor Area sqm',
    'Bedroom', 'Bathroom',
    'Preview Photo',
    'Status', 'Map URL', 'featured', 'Listing Mode',
  ])

  const KEEP = slim ? KEEP_SLIM : KEEP_FULL

  const rows = Array.isArray(data) ? (data as unknown as Array<Record<string, unknown>>) : []
  return rows
    .map((rawRow) => {
      const row: Record<string, unknown> = {}
      for (const key of KEEP) {
        if (key in rawRow) row[key] = rawRow[key]
      }
      return mapToPublicListing(row)
    })
    .filter((listing: PublicListing) => listing.price !== null || listing.previewPhoto !== null)
}
