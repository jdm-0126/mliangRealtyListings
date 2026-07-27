import { supabase } from "@/lib/supabase/client";

export async function toggleGalleryFeatured(
  id: string,
  featured: boolean
) {
  const { error } = await supabase
    .from("gallery")
    .update({
      is_featured: featured,
    })
    .eq("id", id);

  if (error) throw error;
}