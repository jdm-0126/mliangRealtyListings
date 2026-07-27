import { supabase } from '@/lib/supabase/client'

export async function deleteGalleryItem(id: string) {
  const { error } = await supabase
    .from("gallery")
    .delete()
    .eq("id", id);

  if (error) throw error;
}