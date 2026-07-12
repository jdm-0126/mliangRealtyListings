// app/sitemap.ts
// Next.js App Router sitemap generator — served at /sitemap.xml
// Requirements: 7.1

import type { MetadataRoute } from 'next'
import { getServerClient, DATABASE_ID } from '@/lib/appwrite/server'
import { Query } from 'node-appwrite'

const COL = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_LISTINGS!

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

  const db = getServerClient()
  let listingRoutes: MetadataRoute.Sitemap = []
  try {
    const res = await db.listDocuments(DATABASE_ID, COL, [
      Query.equal('Status', 'active'),
      Query.select(['property_id', '$updatedAt']),
      Query.limit(500),
    ])
    listingRoutes = res.documents.map((l) => {
      const id = Number(l['property_id'])
      const displayId = id > 2 ? id - 1 : id
      return {
        url: `https://realtyprov1.com/listings/${displayId}`,
        lastModified: l.$updatedAt ? new Date(l.$updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }
    })
  } catch { /* return static only */ }

  return [...staticRoutes, ...listingRoutes]
}
