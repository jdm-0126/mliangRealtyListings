import { supabase } from '@/lib/supabase/client'
import { GalleryItem } from '@/lib/shared/types/public'

export async function createGalleryItem(
  values: Omit<GalleryItem, "id">
) {
  const { data, error } = await supabase
    .from("gallery")
    .insert(values)
    .select()
    .single();

  if (error) throw error;

  return data;
}