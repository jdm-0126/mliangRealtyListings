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
  const id = Number(row['Property ID'])
  const photos: string[] = []
  for (let i = 1; i <= 20; i++) {
    const photo = row[`Photo ${i}`]
    if (typeof photo === 'string' && photo.trim()) photos.push(photo.trim())
  }

  return {
    id,
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
    updatedAt: typeof row['updated_at'] === 'string' ? row['updated_at'] : undefined,
  }
}

export async function getCachedPublicListings(): Promise<PublicListing[]> {
  if (!supabase) return []

  // select('*') is required because PostgREST cannot handle column names with
  // spaces in the select string. To stay under Vercel's 19 MB ISR limit we
  // strip every column we don't use right after the fetch, before mapping.
  const { data, error } = await supabase
    .from('mlianglistings')
    .select('*')
    .ilike('Status', 'active')
    .order('"Property ID"', { ascending: false })
    .limit(300)

  if (error) {
    console.error('[publicListings] fetch error:', error.message)
    return []
  }

  // Columns kept for mapToPublicListing — everything else is dropped to
  // reduce the JSON payload that Next.js serialises into the ISR page cache.
  const KEEP = new Set([
    'Property ID', 'Type', 'Location', 'Village',
    'Listing Price', 'ListingPrice', 'Price',
    'Lot Area', 'Lot Area sqm', 'LA',
    'Floor Area', 'Floor Area sqm',
    'Bedroom', 'Bathroom',
    'Preview Photo',
    'Photo 1', 'Photo 2', 'Photo 3', 'Photo 4', 'Photo 5', 'Photo 6',
    'Notes', 'Status', 'Map URL', 'Video URL', 'Facebook Video URL', 'TikTok Video URL', 'updated_at', 'featured',
  ])

  const rows = Array.isArray(data) ? (data as unknown as Array<Record<string, unknown>>) : []
  return rows
    .map((rawRow) => {
      // Keep only the columns we need
      const row: Record<string, unknown> = {}
      for (const key of KEEP) {
        if (key in rawRow) row[key] = rawRow[key]
      }
      return mapToPublicListing(row)
    })
    .filter((listing: PublicListing) => listing.price !== null || listing.previewPhoto !== null)
}
