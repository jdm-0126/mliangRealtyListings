// app/(public)/page.tsx — Estatein dark theme homepage
import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/app/lib/supabaseClient'
import { PublicListing } from '@/lib/types/public'
import { getTenantSettingsServer } from '@/lib/tenantServer'
import { buildLocalBusinessJsonLd } from '@/lib/seo/jsonld'
import ListingCard from '@/app/(public)/components/ListingCard'
import SocialLinks from '@/app/(public)/components/SocialLinks'
import JsonLd from '@/app/(public)/components/JsonLd'
import { Home, Building2, MapPin, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const OG_DESCRIPTION =
  'Browse house and lot, commercial properties, and lot-only listings in Pampanga. M. Liang Realty, licensed broker PRC No. 0019653, serving Pampanga buyers.'

export const metadata: Metadata = {
  title: 'M. Liang Realty – Houses, Lots & Condos in Pampanga',
  description: OG_DESCRIPTION,
  openGraph: {
    title: 'M. Liang Realty – Houses, Lots & Condos in Pampanga',
    description: OG_DESCRIPTION,
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
    url: 'https://realtyprov1.com',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'M. Liang Realty – Houses, Lots & Condos in Pampanga', description: OG_DESCRIPTION, images: ['/og-image.svg'] },
  alternates: { canonical: 'https://realtyprov1.com' },
}

function parsePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
  return isNaN(n) || n <= 0 ? null : n
}
function parseArea(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.]/g, ''))
  return isNaN(n) || n <= 0 ? null : n
}
function mapListing(row: Record<string, unknown>): PublicListing {
  const id = Number(row['Property ID'])
  return {
    id, displayId: id > 2 ? id - 1 : id,
    type: String(row['Type'] ?? ''), location: String(row['Location'] ?? ''),
    village: row['Village'] ? String(row['Village']) : undefined,
    price: parsePrice(row['Listing Price'] ?? row['ListingPrice'] ?? row['Price']),
    lotArea: parseArea(row['Lot Area'] ?? row['Lot Area sqm'] ?? row['LA']),
    floorArea: parseArea(row['Floor Area'] ?? row['Floor Area sqm']),
    bedrooms: parseArea(row['Bedroom']), bathrooms: parseArea(row['Bathroom']),
    previewPhoto: row['Preview Photo'] ? String(row['Preview Photo']) : null,
    photos: [], notes: String(row['Notes'] ?? ''), status: String(row['Status'] ?? ''),
    updatedAt: row['updated_at'] ? String(row['updated_at']) : undefined,
  }
}

const SERVICES = [
  {
    icon: Home,
    title: 'Property Sales',
    desc: 'House and lot, townhouse, and commercial properties across Pampanga — matched to your budget and needs.',
  },
  {
    icon: Building2,
    title: 'Rental Properties',
    desc: 'Residential rentals in San Fernando and surrounding areas — houses, apartments, and condominiums.',
  },
  {
    icon: MapPin,
    title: 'Lot Sales',
    desc: 'Premium lot-only properties in prime Pampanga locations so you can build your dream home on your terms.',
  },
]

export default async function HomePage() {
  const settings = getTenantSettingsServer()
  let listings: PublicListing[] = []
  let fetchError = false
  let isFeaturedSet = false

  if (supabase) {
    const { data: featuredData, error: featuredError } = await supabase
      .from('mlianglistings').select('*').ilike('Status', 'active').eq('featured', true)
      .order('Property ID', { ascending: false }).limit(6)

    if (featuredError) { fetchError = true }
    else {
      const featured = (featuredData ?? []).map((r: Record<string, unknown>) => mapListing(r))
        .filter((l: PublicListing) => l.price !== null || l.previewPhoto !== null)

      if (featured.length === 6) { isFeaturedSet = true; listings = featured }
      else if (featured.length > 0) {
        isFeaturedSet = true
        const featuredIds = featured.map(l => l.id)
        const needed = 6 - featured.length
        const { data: padData } = await supabase.from('mlianglistings').select('*')
          .ilike('Status', 'active').not('Property ID', 'in', `(${featuredIds.join(',')})`)
          .order('Property ID', { ascending: false }).limit(needed * 3)
        const padded = (padData ?? []).map((r: Record<string, unknown>) => mapListing(r))
          .filter((l: PublicListing) => l.price !== null || l.previewPhoto !== null).slice(0, needed)
        listings = [...featured, ...padded]
      } else {
        const { data: newestData, error: newestError } = await supabase.from('mlianglistings').select('*')
          .ilike('Status', 'active').order('Property ID', { ascending: false }).limit(18)
        if (newestError) { fetchError = true }
        else {
          listings = (newestData ?? []).map((r: Record<string, unknown>) => mapListing(r))
            .filter((l: PublicListing) => l.price !== null || l.previewPhoto !== null).slice(0, 6)
        }
      }
    }
  } else { fetchError = true }

  return (
    <>
      <JsonLd data={buildLocalBusinessJsonLd(settings)} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24 px-4"
        style={{ background: 'var(--est-bg)' }}
      >
        {/* Decorative blob */}
        <div
          className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--est-purple) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-7"
            style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)', color: 'var(--est-muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--est-purple)' }} />
            Licensed Real Estate Broker · PRC No. {settings.prcNumber}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5"
            style={{ color: 'var(--est-text)' }}>
            Find Your{' '}
            <span style={{ color: 'var(--est-purple)' }}>Dream Property</span>
            <br />in Pampanga
          </h1>

          <p className="text-base sm:text-lg max-w-2xl mx-auto mb-10"
            style={{ color: 'var(--est-muted)' }}>
            {settings.businessName} offers house and lot, lot-only, and commercial listings across San Fernando and Pampanga. Browse active properties or send us an inquiry.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/listings"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'var(--est-purple)', color: '#fff' }}
            >
              Browse Listings <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: 'var(--est-surface)', color: 'var(--est-text)', border: '1px solid var(--est-border)' }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Listings ─────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: 'var(--est-surface)' }}>
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--est-purple)' }}>
                {isFeaturedSet ? 'Hand-Picked' : 'Latest'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--est-text)' }}>
                Featured Properties
              </h2>
            </div>
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--est-purple)' }}
            >
              View all listings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {fetchError ? (
            <p className="text-center py-16" style={{ color: 'var(--est-muted)' }}>
              Unable to load listings at this time.
            </p>
          ) : listings.length === 0 ? (
            <p className="text-center py-16" style={{ color: 'var(--est-muted)' }}>
              No listings available at the moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: 'var(--est-bg)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--est-purple)' }}>
              What We Offer
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--est-text)' }}>
              Our Services
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-7 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'var(--est-elevated)', border: '1px solid var(--est-border)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--est-purple)' }} />
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--est-text)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--est-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social row ───────────────────────────────────────────────────── */}
      <section
        className="py-12 px-4"
        style={{ background: 'var(--est-surface)', borderTop: '1px solid var(--est-border)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--est-muted)' }}>
            Follow Us
          </p>
          <SocialLinks />
        </div>
      </section>
    </>
  )
}
