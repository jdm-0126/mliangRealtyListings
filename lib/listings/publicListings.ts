import { supabase } from '@/lib/supabase/browserTenantClient'
import { PublicListing } from '@/lib/types/public'

export function parsePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
  return isNaN(n) || n <= 0 ? null : n
}

export function parseArea(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
  return isNaN(n) || n <= 0 ? null : n
}

export function mapToPublicListing(row: Record<string, unknown>): PublicListing {
  const id = Number(row['property_id'])
  const propertyId = Number(row.property_id ?? '')
  const photos: string[] = []
  for (let i = 1; i <= 20; i++) {
    const photo = row[`Photo ${i}`]
    if (typeof photo === 'string' && photo.trim()) photos.push(photo.trim())
  }

  return {
    id,
    propertyId,
    displayId: id > 2 ? id - 1 : id,
    type: String(row.type ?? ''),
    location: String(row.location ?? ''),
    village:
      typeof row.village === 'string'
        ? row.village
        : undefined,
    price: parsePrice(row.listing_price),
    lotArea: parseArea(row.lot_area),
    floorArea: parseArea(row.floor_area),

    bedrooms: parseArea(row.bedroom),
    bathrooms: parseArea(row.bathroom),

    previewPhoto:
      typeof row.preview_photo === 'string'
        ? row.preview_photo
        : null,

    photos: [],

    notes: String(row.notes ?? ''),

    status: String(row.status ?? ''),

    mapUrl:
      typeof row.map_url === 'string'
        ? row.map_url
        : null,

    videoUrl:
      typeof row.video_url === 'string'
        ? row.video_url
        : null,

    featured: row.featured === true,

    listingMode:
      typeof row.listing_mode === 'string'
        ? row.listing_mode
        : undefined,

    updatedAt:
      typeof row.updated_at === 'string'
        ? row.updated_at
        : undefined,
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
    'property_id',
    'type',
    'location',
    'village',
    'listing_price',
    'lot_area_sqm',
    'floor_area_sqm',
    'bedroom',
    'bathroom',
    'preview_photo',
    'status',
    'map_url',
    'featured',
    'listing_mode',
    'updated_at',
  ])

  // Primary: explicitly flagged featured listings
  const { data: featuredData, error: featuredError } = await supabase
    .from('listings')
    .select('*')
    .ilike('status', 'active')
    .eq('featured', true)
    .order('property_id', { ascending: false })
    .limit(6)

  if (featuredError) {
    console.error('[getFeaturedListings]', featuredError)
    return []
  }

  const featured = Array.isArray(featuredData) && featuredData.length > 0
    ? featuredData as Array<Record<string, unknown>>
    : null

  // Fallback: newest active listings
  if (!featured) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('listings')
      .select('*')
      .ilike('status', 'active')
      .order('property_id', { ascending: false })
      .limit(12)

    if (fallbackError) {
      console.error('[getFeaturedListings fallback]', fallbackError)
      return []
    }

    const rows = Array.isArray(fallbackData)
      ? fallbackData as Array<Record<string, unknown>>
      : []

    return rows
      .map(rawRow => {
        const row: Record<string, unknown> = {}

        for (const key of KEEP) {
          if (key in rawRow) {
            row[key] = rawRow[key]
          }
        }

        return mapToPublicListing(row)
      })
      .filter(
        listing =>
          listing.price !== null ||
          listing.previewPhoto !== null
      )
      .slice(0, 6)
  }

  return featured
    .map(rawRow => {
      const row: Record<string, unknown> = {}

      for (const key of KEEP) {
        if (key in rawRow) {
          row[key] = rawRow[key]
        }
      }

      return mapToPublicListing(row)
    })
    .filter(
      listing =>
        listing.price !== null ||
        listing.previewPhoto !== null
    )
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
    .from('listings')
    .select('*')
    // .ilike('status', 'active')
    .order('"property_id"', { ascending: false })
    .limit(300)

  if (error) throw error;

  const KEEP_FULL = new Set([
    'property_id',
    'type',
    'location',
    'village',
    'listing_price',
    'lot_area',
    'floor_area',
    'bedroom',
    'bathroom',
    'preview_photo',
    'photo 1', 'photo 2', 'photo 3', 'photo 4', 'photo 5', 'photo 6',
    'notes',
    'status',
    'map_url',
    'video_url',
    'updated_at',
    'featured',
    'listing_mode',
  ])

  // Slim: card-level fields only — no notes, no full photo array, no video URLs
  const KEEP_SLIM = new Set([
    'property_id',
    'type',
    'location',
    'village',
    'listing_price',
    'lot_area',
    'floor_area',
    'bedroom',
    'bathroom',
    'preview_photo',
    'photo',
    'notes',
    'status',
    'map_url',
    'video_url',
    'updated_at',
    'featured',
    'listing_mode',
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