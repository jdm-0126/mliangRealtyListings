import { supabase } from "@/lib/supabase/browserTenantClient";

export async function getPropertyGallery(
  listingId: number
) {
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at");

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}