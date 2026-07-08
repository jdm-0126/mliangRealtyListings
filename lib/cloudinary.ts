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
