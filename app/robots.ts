// app/robots.ts  (Next.js App Router convention → served at /robots.txt)
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/listings', '/listings/', '/about', '/contact'],
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: 'https://realtyprov1.com/sitemap.xml',
  }
}
