import { supabase } from "@/lib/supabase/client";

async function deleteListing(id: string | number) {
  const { error } = await supabase
    .from("mlianglistings")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}