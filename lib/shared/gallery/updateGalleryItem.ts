import { supabase } from '@/lib/supabase/client'

export async function updateGalleryItem(
  id: string,
  values: {
    title?: string | null;
    description?: string | null;
    listing_id?: number | null;
    is_featured?: boolean;
  }
) {
  const { error } = await supabase
    .from("gallery")
    .update(values)
    .eq("id", id);

  if (error) throw error;
}