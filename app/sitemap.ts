// app/sitemap.ts
// Next.js App Router sitemap generator — served at /sitemap.xml
// Requirements: 7.1

import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase/browserTenantClient'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: 'https://realtyprov1.com/',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://realtyprov1.com/listings',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://realtyprov1.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://realtyprov1.com/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  if (!supabase) {
    return staticRoutes
  }

  // Fetch only the minimal columns needed — avoids the oversized photo arrays
  const { data: listings } = await supabase
    .from('listings')
    .select('"property_id", updated_at')
    .ilike('status', 'active')

  const listingRoutes: MetadataRoute.Sitemap = (listings ?? []).map(
    (l: Record<string, unknown>) => {
      const id = Number(l['property_id'])
      // Apply the same displayId transform used across the public site
      const displayId = id > 2 ? id - 1 : id
      return {
        url: `https://realtyprov1.com/listings/${displayId}`,
        lastModified: l.updated_at ? new Date(String(l.updated_at)) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }
    }
  )

  return [...staticRoutes, ...listingRoutes]
}