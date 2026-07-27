// app/sitemap.ts

import type { MetadataRoute } from "next";
import { supabaseAdmin  } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://realtyprov1.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  try {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("property_id, updated_at")
      .order("property_id");

    if (error) throw error;

    const listingRoutes =
      data?.map((listing) => {
        const id = Number(listing.property_id);
        const displayId = id > 2 ? id - 1 : id;

        return {
          url: `${baseUrl}/listings/${displayId}`,
          lastModified: listing.updated_at
            ? new Date(listing.updated_at)
            : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        };
      }) ?? [];

    return [...staticRoutes, ...listingRoutes];
  } catch {
    return staticRoutes;
  }
}