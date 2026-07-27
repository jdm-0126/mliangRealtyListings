import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

export async function getAdminListings() {
  const { data, error } = await supabaseAdmin
    .from("mlianglistings")
    .select("*")
    .order("property_id", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data;
}