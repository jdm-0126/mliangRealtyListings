import { supabase } from "@/lib/supabase/browserTenantClient";

// export async function getPropertyGallery(propertyId: number): Promise<string[]> {
//   const { data, error } = await supabase
//   .from("gallery")
//   .select("cloudinary_secure_url, cloudinary_url, title")
//   .eq("property_id", propertyId);

//   if (error) {
//     console.error("Gallery query failed:", error.message);
//     return [];
//   }

//   // Extract valid Cloudinary URLs
//   return (data || [])
//     .map((item) => item.cloudinary_secure_url || item.cloudinary_url)
//     .filter((url): url is string => Boolean(url && typeof url === "string" && url.trim()));
// }
export async function getPropertyGallery(propertyId: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("gallery")
    .select("cloudinary_secure_url, cloudinary_url")
    .eq("property_id", propertyId);

  if (error) {
    console.error("Gallery query failed:", error.message);
    return [];
  }

  // Extract valid Cloudinary URLs
  return (data || [])
    .map((item) => item.cloudinary_secure_url || item.cloudinary_url)
    .filter((url): url is string => Boolean(url && typeof url === "string" && url.trim().length > 0));
}