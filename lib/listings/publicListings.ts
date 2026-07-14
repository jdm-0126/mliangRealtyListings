import { getServerClient, DATABASE_ID } from '@/lib/appwrite/server'
import { Query } from 'node-appwrite'
import { PublicListing } from '@/lib/types/public'

const COL = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_LISTINGS!

function parseNum(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
  return isNaN(n) || n <= 0 ? null : n
}

function mapRow(doc: Record<string, unknown>): PublicListing {
  const id = Number(doc['property_id'])
  const photos = Array.isArray(doc['Photos'])
    ? (doc['Photos'] as string[]).filter(Boolean)
    : []

  return {
    property_id: id,
    displayId: id > 2 ? id - 1 : id,
    type: String(doc['Type'] ?? ''),
    location: String(doc['Location'] ?? ''),
    village: typeof doc['Village'] === 'string' ? doc['Village'] : undefined,
    price: parseNum(doc['Listing_Price']),
    lotArea: parseNum(doc['Lot_Area_sqm']),
    floorArea: parseNum(doc['Floor_Area_sqm']),
    bedrooms: parseNum(doc['Bedroom']),
    bathrooms: parseNum(doc['Bathroom']),
    previewPhoto: typeof doc['Preview_Photo'] === 'string' && doc['Preview_Photo'].trim() ? doc['Preview_Photo'].trim() : null,
    photos,
    notes: String(doc['Notes'] ?? ''),
    status: String(doc['Status'] ?? ''),
    mapUrl: typeof doc['Map_URL'] === 'string' && doc['Map_URL'].trim() ? doc['Map_URL'].trim() : null,
    videoUrl: typeof doc['Video_URL'] === 'string' && doc['Video_URL'].trim() ? doc['Video_URL'].trim() : null,
    facebookVideoUrl: typeof doc['Facebook_Video_URL'] === 'string' && doc['Facebook_Video_URL'].trim() ? doc['Facebook_Video_URL'].trim() : null,
    tiktokVideoUrl: typeof doc['Tiktok_Video_URL'] === 'string' && doc['Tiktok_Video_URL'].trim() ? doc['Tiktok_Video_URL'].trim() : null,
    featured: doc['featured'] === true,
    listingMode: typeof doc['Listing_Mode'] === 'string' ? doc['Listing_Mode'].trim() : undefined,
    updatedAt: typeof doc['$updatedAt'] === 'string' ? doc['$updatedAt'] : undefined,
  }
}

export async function getCachedPublicListings(): Promise<PublicListing[]> {
  return fetchListings(false)
}

export async function getSlimPublicListings(): Promise<PublicListing[]> {
  return fetchListings(true)
}

export async function getFeaturedListings(): Promise<PublicListing[]> {
  const db = getServerClient()
  try {
    const res = await db.listDocuments(DATABASE_ID, COL, [
      Query.equal('featured', true),
      Query.orderDesc('property_id'),
      Query.limit(6),
    ])

    const featured = res.documents.map(d => mapRow(d as unknown as Record<string, unknown>))

    if (featured.length > 0) return featured

    // fallback: newest 6
    const fallback = await db.listDocuments(DATABASE_ID, COL, [
      Query.orderDesc('property_id'),
      Query.limit(6),
    ])
    return fallback.documents
      .map(d => mapRow(d as unknown as Record<string, unknown>))
  } catch (e) {
    console.error('[getFeaturedListings]', e)
    return []
  }
}

async function fetchListings(_slim: boolean): Promise<PublicListing[]> {
  const db = getServerClient()
  const res = await db.listDocuments(DATABASE_ID, COL, [
  Query.orderDesc("property_id"),
  Query.limit(1000),
]);

console.log("TOTAL:", res.total);
console.log("RETURNED:", res.documents.length);
  try {
    const res = await db.listDocuments(DATABASE_ID, COL, [
      Query.orderDesc('property_id'),
      Query.limit(1000),
    ])
    return res.documents.map(d => mapRow(d as unknown as Record<string, unknown>))
  } catch (e) {
    console.error('[fetchListings]', e)
    return []
  }
}
