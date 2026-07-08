'use client'
// app/(public)/components/FeaturedVideoSection.tsx

import { useEffect, useState } from 'react'

const SETTINGS_KEY = 'tenantSettings'

/** Normalise any Facebook video/reel/watch URL for the embed plugin. */
function normaliseFbVideoUrl(raw: string): string {
  try {
    const url = new URL(raw)
    const hostname = url.hostname.replace(/^www\./, '')
    if (hostname === 'fb.watch') return raw
    if (hostname === 'facebook.com' || hostname === 'm.facebook.com') {
      const path = url.pathname.replace(/\/$/, '')
      if (path.startsWith('/reel/')) return raw
      const v = url.searchParams.get('v')
      if (v) return `https://www.facebook.com/watch/?v=${v}`
      if (path.includes('/videos/')) return raw
    }
  } catch { /* invalid URL — pass through */ }
  return raw
}

/** Reels and shorts are portrait (9:16). Matches "reel" anywhere in the URL. */
function isPortrait(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.includes('/reel') || lower.includes('reel/') || lower.includes('shorts/')
}

export default function FeaturedVideoSection() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (!raw) return
      const settings = JSON.parse(raw)
      const url = settings.featuredVideoUrl?.trim()
      if (url) setVideoUrl(normaliseFbVideoUrl(url))
    } catch { /* ignore */ }
  }, [])

  if (!videoUrl) return null

  const portrait = isPortrait(videoUrl)
  const embedSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false&autoplay=false`

  return (
    <section className="mt-14">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--est-purple)' }}>
          Watch
        </p>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--est-text)' }}>
          Latest from Our Page
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--est-muted)' }}>
          Follow us on Facebook for property tours and updates.
        </p>
      </div>

      {portrait ? (
        /* ── Portrait reel — 9:16, centered, max 380px wide ── */
        <div className="flex justify-center">
          <div
            className="relative overflow-hidden rounded-2xl w-full"
            style={{
              maxWidth: 380,
              aspectRatio: '9 / 16',
              border: '1px solid var(--est-border)',
            }}
          >
            <iframe
              src={embedSrc}
              className="absolute inset-0 w-full h-full"
              style={{ border: 'none' }}
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              title="Featured property reel"
            />
          </div>
        </div>
      ) : (
        /* ── Landscape video — 16:9, full width ── */
        <div
          className="relative w-full overflow-hidden rounded-2xl"
          style={{ aspectRatio: '16 / 9', border: '1px solid var(--est-border)' }}
        >
          <iframe
            src={`${embedSrc}&width=1280`}
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none' }}
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            title="Featured property video"
          />
        </div>
      )}

      <p className="mt-2 text-xs text-center" style={{ color: 'var(--est-muted)' }}>
        Video not loading?{' '}
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80"
          style={{ color: 'var(--est-purple)' }}
        >
          Watch on Facebook →
        </a>
      </p>
    </section>
  )
}
