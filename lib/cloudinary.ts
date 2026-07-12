/**
 * lib/cloudinary.ts
 * Uploads via /api/cloudinary-upload (server-side signed) — no upload preset needed.
 */

export interface CloudinaryUploadResult {
  public_id:  string
  url:        string
  secure_url: string
  width:      number
  height:     number
  format:     string
  bytes:      number
}

export async function uploadToCloudinary(
  file: File,
  folder = 'GalleryMliang'
): Promise<CloudinaryUploadResult> {
  const body = new FormData()
  body.append('file', file)
  body.append('folder', folder)

  const res = await fetch('/api/cloudinary-upload', { method: 'POST', body })
  const data = await res.json()

  if (!res.ok) throw new Error(data?.error ?? `Upload failed (${res.status})`)
  return data
}

export async function uploadManyToCloudinary(
  files: File[],
  folder = 'GalleryMliang',
  onProgress?: (done: number, total: number) => void
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = []
  const BATCH = 5

  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH)
    const batchResults = await Promise.all(batch.map(f => uploadToCloudinary(f, folder)))
    results.push(...batchResults)
    onProgress?.(Math.min(i + BATCH, files.length), files.length)
  }

  return results
}

export function buildPropertyUploadFolder(propertyId: number | string): string {
  return `GalleryMliang/property/${propertyId}`
}

export function buildSharpenedCloudinaryUrl(url: string): string {
  if (!url) return url
  if (!url.includes('/image/upload/')) return url

  const marker = '/image/upload/'
  const parts = url.split(marker)
  if (parts.length < 2) return url

  return `${parts[0]}${marker}e_sharpen:100,q_auto,f_auto/${parts[1]}`
}

export function buildPropertyGalleryRecord(args: {
  tenantId: string
  propertyId: number | string
  title?: string | null
  secureUrl: string
  publicId: string
  category?: 'property' | 'event' | 'general'
  isFeatured?: boolean
}): Record<string, unknown> {
  return {
    tenant_id: args.tenantId,
    category: args.category ?? 'property',
    title: args.title ?? null,
    cloudinary_public_id: args.publicId,
    cloudinary_url: args.secureUrl,
    cloudinary_secure_url: args.secureUrl,
    listing_id: Number(args.propertyId),
    is_featured: args.isFeatured ?? false,
  }
}
