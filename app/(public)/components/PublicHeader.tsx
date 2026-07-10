'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

interface PublicHeaderProps {
  businessName: string
}

const NAV_LINKS = [
  { label: 'Listings', href: '/listings' },
  { label: 'For Sale', href: '/for-sale' },
  { label: 'For Rent', href: '/for-rent' },
  { label: 'About', href: '/about' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
]

// Shown only in the mobile drawer + desktop as a secondary text link beside the CTA
const SELL_LINK = { label: 'List Your Property', href: '/contact?tab=sell' }

export default function PublicHeader({ businessName }: PublicHeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Active-state highlight deferred until after hydration.
  // Server renders no active state → client matches → no mismatch.
  useEffect(() => { setMounted(true) }, [])

  function isActive(href: string) {
    if (!mounted) return false
    if (href === '/listings') return pathname === '/' || pathname === '/listings' || pathname.startsWith('/listings')
    return pathname.startsWith(href)
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'var(--est-surface)',
        borderBottom: '1px solid var(--est-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/listings" className="flex items-center gap-2 group">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'var(--est-purple)' }}
            >
              M
            </span>
            <span
              className="text-base font-semibold tracking-tight"
              style={{ color: 'var(--est-text)' }}
            >
              {businessName}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:opacity-100"
                style={{
                  color: isActive(href) ? 'var(--est-text)' : 'var(--est-muted)',
                  background: isActive(href) ? 'var(--est-elevated)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive(href)) (e.currentTarget as HTMLElement).style.background = 'var(--est-elevated)'
                }}
                onMouseLeave={e => {
                  if (!isActive(href)) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={SELL_LINK.href}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ color: 'var(--est-muted)' }}
            >
              {SELL_LINK.label}
            </Link>
            <Link
              href="/book"
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'var(--est-purple)', color: '#fff' }}
            >
              Book a Viewing
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: 'var(--est-muted)' }}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((p) => !p)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden px-4 pt-2 pb-4 flex flex-col gap-1"
          style={{ borderTop: '1px solid var(--est-border)' }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.97] active:opacity-80"
              style={{
                color: isActive(href) ? 'var(--est-text)' : 'var(--est-muted)',
                background: isActive(href) ? 'var(--est-elevated)' : 'transparent',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => {
                if (!isActive(href)) (e.currentTarget as HTMLElement).style.background = 'var(--est-elevated)'
              }}
              onMouseLeave={e => {
                if (!isActive(href)) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
              onPointerDown={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'var(--est-purple)'
                el.style.color = '#fff'
              }}
              onPointerUp={e => {
                const el = e.currentTarget as HTMLElement
                setTimeout(() => {
                  if (!isActive(href)) {
                    el.style.background = 'transparent'
                    el.style.color = 'var(--est-muted)'
                  }
                }, 150)
              }}
              onPointerCancel={e => {
                const el = e.currentTarget as HTMLElement
                if (!isActive(href)) {
                  el.style.background = 'transparent'
                  el.style.color = 'var(--est-muted)'
                }
              }}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/book"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-2 px-5 py-3 rounded-lg text-sm font-semibold text-center transition-all active:scale-[0.97] active:opacity-80"
            style={{ background: 'var(--est-purple)', color: '#fff', WebkitTapHighlightColor: 'transparent' }}
          >
            Book a Viewing
          </Link>
          <Link
            href={SELL_LINK.href}
            onClick={() => setMobileMenuOpen(false)}
            className="px-5 py-3 rounded-lg text-sm font-semibold text-center transition-all active:scale-[0.97] active:opacity-80"
            style={{ background: 'var(--est-elevated)', color: 'var(--est-text)', border: '1px solid var(--est-border)', WebkitTapHighlightColor: 'transparent' }}
          >
            {SELL_LINK.label}
          </Link>
        </div>
      )}
    </header>
  )
}
