import { supabase } from "@/lib/supabase/client";

export type GalleryCategory = "property" | "event" | "general";

export interface GalleryItem {
  id: string;
  title: string | null;
  description: string | null;
  category: GalleryCategory;
  cloudinary_public_id: string;
  cloudinary_secure_url: string;
  width: number | null;
  height: number | null;
  is_featured: boolean;
  display_order: number;
  listing_id: number | null;
  created_at: string;
}

export async function getGallery(
  category: GalleryCategory | "all" = "all",
  featured = false
): Promise<GalleryItem[]> {
  let query = supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });

  if (category !== "all") {
    query = query.eq("category", category);
  }

  if (featured) {
    query = query.eq("is_featured", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getGallery]", error);
    return [];
  }

  return (data ?? []) as GalleryItem[];
}