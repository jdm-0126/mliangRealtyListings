'use client'
// app/(public)/components/FeaturedVideoSection.tsx
// Reads the admin-configured featured Facebook video URL from localStorage
// and renders it as a responsive embed on the main listings page.

import { useEffect, useState } from 'react'

const SETTINGS_KEY = 'tenantSettings'

export default function FeaturedVideoSection() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (!raw) return
      const settings = JSON.parse(raw)
      const url = settings.featuredVideoUrl?.trim()
      if (url) setVideoUrl(url)
    } catch {
      // localStorage unavailable or invalid JSON — silently skip
    }
  }, [])

  if (!videoUrl) return null

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

      {/* Responsive 16:9 Facebook video embed */}
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ paddingBottom: '56.25%', border: '1px solid var(--est-border)' }}
      >
        <iframe
          src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false&autoplay=false&width=1280`}
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none' }}
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          title="Featured property video"
        />
      </div>
    </section>
  )
}
