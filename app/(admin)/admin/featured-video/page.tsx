'use client'
// app/(admin)/admin/featured-video/page.tsx
// Configure the Facebook reel / video shown on the public listings page.

import { useEffect, useState } from 'react'
import { Video, ExternalLink, Info } from 'lucide-react'

const SETTINGS_KEY = 'tenantSettings'

function isPortrait(url: string) {
  return url.toLowerCase().includes('/reel') || url.toLowerCase().includes('shorts/')
}

export default function FeaturedVideoPage() {
  const [url, setUrl] = useState('')
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      const settings = raw ? JSON.parse(raw) : {}
      setUrl(settings.featuredVideoUrl?.trim() ?? '')
    } catch { /* ignore */ }
    setLoaded(true)
  }, [])

  function save() {
    try {
      const existing = (() => {
        try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } catch { return {} }
      })()
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...existing, featuredVideoUrl: url.trim() }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { /* ignore */ }
  }

  const portrait = url.trim() && isPortrait(url)
  const hasUrl = url.trim().length > 0

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'hsl(var(--primary) / 0.1)' }}>
          <Video className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            Featured Video
          </h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Shown on the public listings page after Featured Properties
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border p-6 space-y-5"
        style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>

        <div>
          <label className="block text-sm font-semibold mb-2"
            style={{ color: 'hsl(var(--foreground))' }}>
            Facebook Video / Reel URL
          </label>
          <input
            type="url"
            value={loaded ? url : ''}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.facebook.com/reel/1234567890"
            className="w-full px-3 py-2.5 rounded-lg text-sm"
            style={{
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
              outline: 'none',
            }}
          />
          <p className="text-xs mt-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Paste any Facebook video, reel, or short URL. Leave blank to hide the section.
          </p>
        </div>

        {/* Detection badge */}
        {hasUrl && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{
              background: portrait ? 'hsl(var(--primary) / 0.08)' : 'hsl(142 72% 29% / 0.1)',
              border: `1px solid ${portrait ? 'hsl(var(--primary) / 0.3)' : 'hsl(142 72% 29% / 0.3)'}`,
              color: portrait ? 'hsl(var(--primary))' : 'hsl(142 72% 29%)',
            }}>
            <Video className="w-4 h-4 flex-shrink-0" />
            <span>
              Detected: <strong>{portrait ? 'Portrait reel (9:16)' : 'Landscape video (16:9)'}</strong>
              {' '}— will render in {portrait ? 'centered portrait frame' : 'full-width landscape frame'}
            </span>
          </div>
        )}

        {/* External link preview */}
        {hasUrl && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs hover:underline"
            style={{ color: 'hsl(var(--primary))' }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open video on Facebook to verify it's public
          </a>
        )}

        <button
          onClick={save}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: 'hsl(var(--primary))', color: '#fff' }}
        >
          {saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>

      {/* Requirement note */}
      <div className="mt-6 rounded-xl p-4 flex gap-3"
        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
        <div className="text-xs space-y-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <p><strong>Requirements for the embed to work:</strong></p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>The video must be <strong>Public</strong> (not Friends-only or Private)</li>
            <li>Post from your Facebook <strong>Page</strong>, not a personal profile</li>
            <li>Your domain must be registered at{' '}
              <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer"
                className="underline">developers.facebook.com</a>
              {' '}→ App → Settings → Basic → App Domains
            </li>
          </ul>
        </div>
      </div>

      {/* Live preview link */}
      <div className="mt-4 text-center">
        <a
          href="/listings"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm hover:underline"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          <ExternalLink className="w-4 h-4" />
          Preview on public listings page
        </a>
      </div>
    </div>
  )
}
