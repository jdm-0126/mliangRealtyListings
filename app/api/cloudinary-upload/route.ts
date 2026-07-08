import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function normalizeCloudName(value?: string): string {
  const cleaned = value?.trim()
  if (!cleaned) return ''

  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const url = new URL(cleaned)
      const parts = url.pathname.split('/').filter(Boolean)
      return parts[0] || ''
    } catch {
      return cleaned
    }
  }

  return cleaned
}

const CLOUD_NAME = normalizeCloudName(
  process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'https-www-uplift-management-com'
)
const API_KEY = process.env.CLOUDINARY_API_KEY?.trim() || ''
const API_SECRET = process.env.CLOUDINARY_API_SECRET?.trim() || ''
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET?.trim() || ''

function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&')
  return crypto.createHash('sha256').update(sorted + API_SECRET).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file   = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'GalleryMliang'

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    if (!CLOUD_NAME) {
      return NextResponse.json({ error: 'Cloudinary cloud name is not configured. Set CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.' }, { status: 500 })
    }

    if (!API_KEY || !API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary API credentials are not configured. Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.' }, { status: 500 })
    }

    const timestamp = String(Math.floor(Date.now() / 1000))
    const paramsToSign: Record<string, string> = { folder, timestamp }
    const signature = sign(paramsToSign)

    const body = new FormData()
    body.append('file', file)
    body.append('folder', folder)
    body.append('timestamp', timestamp)
    body.append('api_key', API_KEY)
    body.append('signature', signature)
    body.append('resource_type', 'image')
    if (UPLOAD_PRESET) body.append('upload_preset', UPLOAD_PRESET)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body }
    )

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.message ?? 'Upload failed' }, { status: res.status })
    }

    return NextResponse.json({
      public_id:  data.public_id,
      url:        data.url,
      secure_url: data.secure_url,
      width:      data.width,
      height:     data.height,
      format:     data.format,
      bytes:      data.bytes,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
