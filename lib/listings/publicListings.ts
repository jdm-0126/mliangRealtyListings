import { supabaseAdmin } from '@/lib/supabase/server'
import { PublicListing } from '@/lib/shared/types/public'
import { supabase } from "@/lib/supabase/client";

function parseNum(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
  return isNaN(n) || n <= 0 ? null : n
}

function mapRow(doc: Record<string, unknown>): PublicListing {
  const id = Number(doc["property_id"]);

  const photos = Array.isArray(doc["photos"])
    ? (doc["photos"] as string[]).filter(Boolean)
    : [];

  return {
    property_id: id,
    title: String(doc["title"] ?? ""),
    displayId: id > 2 ? id - 1 : id,

    type: String(doc["type"] ?? ""),
    location: String(doc["location"] ?? ""),
    village:
      typeof doc["village"] === "string"
        ? doc["village"]
        : undefined,

    price: parseNum(doc["listing_price"]),
    lotArea: parseNum(doc["lot_area_sqm"]),
    floorArea: parseNum(doc["floor_area_sqm"]),

    bedrooms: parseNum(doc["bedroom"]),
    bathrooms: parseNum(doc["bathroom"]),

    previewPhoto:
      typeof doc["preview_photo"] === "string" &&
      doc["preview_photo"].trim()
        ? doc["preview_photo"].trim()
        : null,

    photos,

    notes: String(doc["notes"] ?? ""),

    status: String(doc["status"] ?? ""),

    mapUrl:
      typeof doc["map_url"] === "string" &&
      doc["map_url"].trim()
        ? doc["map_url"].trim()
        : null,

    videoUrl:
      typeof doc["video_url"] === "string" &&
      doc["video_url"].trim()
        ? doc["video_url"].trim()
        : null,

    facebookVideoUrl:
      typeof doc["facebook_video_url"] === "string" &&
      doc["facebook_video_url"].trim()
        ? doc["facebook_video_url"].trim()
        : null,

    tiktokVideoUrl:
      typeof doc["tiktok_video_url"] === "string" &&
      doc["tiktok_video_url"].trim()
        ? doc["tiktok_video_url"].trim()
        : null,

    featured: doc["featured"] === true,

    listingMode:
      typeof doc["listing_mode"] === "string"
        ? doc["listing_mode"].trim()
        : undefined,

    updatedAt:
      typeof doc["updated_at"] === "string"
        ? doc["updated_at"]
        : undefined,
  };
}

export async function getCachedPublicListings(): Promise<PublicListing[]> {
  return fetchListings(false)
}

export async function getSlimPublicListings(): Promise<PublicListing[]> {
  return fetchListings(true)
}

export async function getFeaturedListings(): Promise<PublicListing[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("*")
      .eq("featured", true)
      .order("property_id", { ascending: false })
      .limit(6);

    if (error) throw error;

    if (data && data.length > 0) {
      return data.map(mapRow);
    }

    const { data: fallback } = await supabaseAdmin
      .from("listings")
      .select("*")
      .order("property_id", { ascending: false })
      .limit(6);

    return (fallback ?? []).map(mapRow);
  } catch (e) {
    console.error("[getFeaturedListings]", e);
    return [];
  }
}

async function fetchListings(_slim: boolean): Promise<PublicListing[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("*")
      .order("property_id", { ascending: false });

    if (error) throw error;

    return (data ?? []).map(mapRow);
  } catch (e) {
    console.error("[fetchListings]", e);
    return [];
  }
}

export interface AdminListingFilters {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  type?: string
  featured?: boolean
  sort?: string
  limit?: number
  location?: string
}

export async function getAdminListings(filters: AdminListingFilters = {}) {
  const {
    page = 1,
    pageSize = 48,
    limit = 24,
    search,
    status = "all",
    type = "all",
    featured = false,
    sort = "newest",
    location = ""
  } = filters

  let query = supabaseAdmin
    .from("listings")
    .select("*", { count: "exact" })

  if (status !== "all") {
    query = query.eq("status", status)
  }

  if (featured) {
    query = query.eq("featured", true)
  }

  if (type !== "all") {
    query = query.ilike("type", `%${type}%`)
  }

  if (search?.trim()) {
    query = query.or(
      `location.ilike.%${search}%,village.ilike.%${search}%`
    )
  }

  switch (sort) {
    case "oldest":
      query = query.order("property_id", { ascending: true })
      break

    case "price-low":
      query = query.order("listing_price", { ascending: true })
      break

    case "price-high":
      query = query.order("listing_price", { ascending: false })
      break

    default:
      query = query.order("property_id", { ascending: false })
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } =
    await query.range(from, to)

  if (error) throw error

 return {
    data: data.map(mapRow),
    pagination:{
      page,
      limit,
      location,
      total: count ?? 0,
      totalPages: Math.ceil(
        (count ?? 0) / limit
      )
    }
  };
}

export async function getListings() {
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .order("property_id", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function createListing(values: Partial<PublicListing>) {
  return supabaseAdmin
    .from("listings")
    .insert(values)
    .select()
    .single()
}

export async function updateListing(
  id: number,
  values: Partial<PublicListing>
) {
  return supabaseAdmin
    .from("listings")
    .update(values)
    .eq("property_id", id)
}

export async function deleteListing(id: number) {
  return supabaseAdmin
    .from("listings")
    .delete()
    .eq("property_id", id)
}

export async function getListingById(id: number) {
  const { data, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("property_id", id)
    .single()

  if (error) throw error

  return mapRow(data)
}
