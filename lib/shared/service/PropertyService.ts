// lib/shared/components/property/PropertyService.ts

import { supabase } from '@/lib/supabase/browserTenantClient'
import { Property } from '@/lib/shared/types/public'

const TABLE = 'listings'
function toDatabase(property: Property) {
  return {
    id: property.id,
    property_id: property.propertyId,

    title: property.title,
    description: property.description,
    notes: property.notes,

    status: property.status,
    type: property.type,

    village: property.village,
    location: property.location,

    listing_agent: property.listingAgent,
    listing_mode: property.listingMode,

    listing_price: property.listingPrice,

    preview_photo: property.preview_photo,
    photos: property.photos,
    fb_link: property.fbLink,

    video_url: property.videoUrl,
    facebook_video_url: property.facebookVideoUrl,

    bedroom: property.bedrooms,
    bathroom: property.bathrooms,

    lot_area_sqm: property.lotArea,
    floor_area_sqm: property.floorArea,

    financing_options: property.financingOptions,

    negotiable: property.negotiable,

    featured: property.featured,

    map_url: property.mapUrl,

    cgt: property.cgt,
    transfer_title: property.transferTitle,

    tenant_id: property.tenantId,
    user_id: property.userId,
  }
}

export function fromDatabase(row: any): Property {
  return {
    id: row.id,
    displayId: row.id,
    propertyId: row.property_id,
    title: row.title,
    description: row.description,
    notes: row.notes,
    status: row.status,
    type: row.type,

    village: row.village,
    location: row.location,

    listingAgent: row.listing_agent,

    listingMode: row.listing_mode,

    listingPrice: row.listing_price,

    preview_photo: row.preview_photo,
    photos: row.photos,
    fbLink: row.fb_link,

    videoUrl: row.video_url,
    facebookVideoUrl: row.facebook_video_url,

    bedrooms: row.bedroom,
    bathrooms: row.bathroom,

    lotArea: row.lot_area_sqm,
    floorArea: row.floor_area_sqm,

    financingOptions: row.financing_options,

    negotiable: row.negotiable,

    featured: row.featured,

    mapUrl: row.map_url,

    cgt: row.cgt,

    transferTitle: row.transfer_title,

    tenantId: row.tenant_id,

    userId: row.user_id,
  }
}

export async function getProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('property_id', { ascending: false })
    console.log("data:", data)
  if (error) throw error

  return (data ?? []).map(fromDatabase)
}
export async function getPropertyById(id: number): Promise<Property | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('property_id', id)
    .single()

  if (error) throw error
  if (!data) return null

  return fromDatabase(data)
}

export async function getFeaturedProperties(limit = 6): Promise<Property[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('featured', true)
    .order('property_id', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map(fromDatabase)
}

export function listingToProperty(
    listing: Property
): Property {
    return {
        id: listing.id,
        userId: listing.userId,
        displayId: String(listing.id),
        propertyId: listing.propertyId,

        title: listing.title,
        location: listing.location,
        village: listing.village,
        listingPrice: listing.listingPrice,

        lotArea: listing.lotArea,
        floorArea: listing.floorArea,

        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,

        preview_photo: listing.preview_photo,
        photos: listing.photos,

        notes: listing.notes,

        status: listing.status,

        listingMode: listing.listingMode,

        listingAgent: listing.listingAgent,

        videoUrl: listing.videoUrl,

        facebookVideoUrl: listing.facebookVideoUrl,

        fbLink: listing.fbLink,

        featured: listing.featured,

        mapUrl: listing.mapUrl,

        type: listing.type,
    }
}
/**
 * Load all database columns.
 * Used by PropertyForm to dynamically render fields.
 */
export async function loadColumns(): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .limit(1)

  if (error) {
    console.error('loadColumns()', error)
    return []
  }

  if (!data?.length) return []

  return Object.keys(data[0]).sort()
}

/**
 * Remove fields that should never be written.
 */
function cleanProperty(property: Property) {
  const payload = { ...property }

  delete (payload as any).created_at
  delete (payload as any).updated_at

  return payload
}

/**
 * Create or update a property.
 */
export async function saveProperty(property: Property): Promise<Property> {
    const payload = {
      ...toDatabase(property),
    }

    delete (payload as Partial<typeof payload>).id

    if (property.id) {
        const { data, error } = await supabase
            .from(TABLE)
            .update(payload)
            .eq('id', property.id)
            .select()
            .single()

        if (error) throw error

        return fromDatabase(data)
    }

    const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select()
        .single()

    if (error) throw error

    return fromDatabase(data)
}

