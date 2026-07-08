'use client'
// app/(public)/components/SocialTopBar.tsx
// Slim "Follow us" bar that sits above the sticky header.

import SocialLinks from './SocialLinks'

export default function SocialTopBar() {
  return (
    <div
      className="w-full"
      style={{ background: 'var(--est-surface)', borderBottom: '1px solid var(--est-border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-end gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--est-muted)' }}>
          Follow us
        </span>
        <SocialLinks />
      </div>
    </div>
  )
}
