'use client'
// app/(public)/components/SocialLinks.tsx

import { useEffect, useState } from 'react'
import { Facebook, Instagram, Youtube, Linkedin } from 'lucide-react'
import {
  getConfiguredSocialLinks,
  getSocialLinksFromStorage,
  type SocialLinkConfig,
  type SocialPlatform,
} from '@/lib/social'

// ── Inline SVG icons for platforms not in lucide-react ─────────────────────

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11.985 2C6.5 2 2.014 6.486 2.014 11.97c0 2.48.918 4.845 2.577 6.664L3 21.5l3.002-1.43A9.912 9.912 0 0 0 11.985 22c5.485 0 9.972-4.486 9.972-9.97 0-5.485-4.487-9.97-9.972-10zm5.297 13.81c-.258.72-1.498 1.373-2.065 1.438-.524.06-1.186.085-1.91-.12a17.484 17.484 0 0 1-1.73-.64c-3.04-1.316-5.02-4.38-5.17-4.58-.148-.2-1.21-1.608-1.21-3.065 0-1.457.763-2.172 1.033-2.467.27-.295.588-.37.784-.37.197 0 .393.002.565.01.18.01.424-.068.664.507.246.586.836 2.04.91 2.187.073.148.122.32.024.515-.097.196-.146.317-.293.488-.147.172-.308.384-.44.516-.147.147-.3.307-.13.6.172.295.763 1.26 1.637 2.04 1.125 1.005 2.072 1.316 2.368 1.464.295.148.467.123.64-.074.17-.197.734-.858 1.03-1.152.295-.293.564-.245.952-.098.39.147 2.45 1.155 2.87 1.366.42.21.7.318.803.49.1.172.1.99-.157 1.71z" />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  )
}

function PlatformIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  switch (platform) {
    case 'facebook':  return <Facebook className={className} aria-hidden="true" />
    case 'instagram': return <Instagram className={className} aria-hidden="true" />
    case 'youtube':   return <Youtube className={className} aria-hidden="true" />
    case 'tiktok':    return <TikTokIcon className={className} />
    case 'x':         return <XIcon className={className} />
    case 'linkedin':  return <Linkedin className={className} aria-hidden="true" />
    case 'whatsapp':  return <WhatsAppIcon className={className} />
    case 'viber':     return <ViberIcon className={className} />
    default:          return null
  }
}

export default function SocialLinks() {
  // Start with env-var links (SSR-safe), upgrade to localStorage links after hydration
  const [links, setLinks] = useState<SocialLinkConfig[]>(() => getConfiguredSocialLinks())

  useEffect(() => {
    const fromStorage = getSocialLinksFromStorage()
    // Prefer localStorage values; fall back to env if storage is empty
    setLinks(fromStorage.length > 0 ? fromStorage : getConfiguredSocialLinks())

    // Re-read when settings are saved in another tab / component
    function onStorage(e: StorageEvent) {
      if (e.key === 'tenantSettings') {
        const fromStore = getSocialLinksFromStorage()
        setLinks(fromStore.length > 0 ? fromStore : getConfiguredSocialLinks())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (links.length === 0) return null

  return (
    <div className="flex flex-row items-center gap-4">
      {links.map((link) => (
        <a
          key={link.platform}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className="transition-colors hover:opacity-80"
          style={{ color: 'var(--est-muted)' }}
        >
          <PlatformIcon platform={link.platform} className="w-6 h-6" />
        </a>
      ))}
    </div>
  )
}
