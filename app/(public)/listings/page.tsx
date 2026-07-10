// app/(public)/listings/page.tsx
import type { Metadata } from 'next'
import { PublicListing } from '@/lib/types/public'
import MaintenanceBanner from '@/app/(public)/components/MaintenanceBanner'
import FeaturedSearchSection from '@/app/(public)/components/FeaturedSearchSection'
import FeaturedVideoSection from '@/app/(public)/components/FeaturedVideoSection'
import BookingCTASection from '@/app/(public)/components/BookingCTASection'
import { getFeaturedListings } from '@/lib/listings/publicListings'

export const dynamic = 'force-static'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Properties for Sale & Rent – M. Liang Realty',
  description:
    'Browse house and lot, lot only, and commercial properties in Pampanga. ' +
    'M. Liang Realty offers a wide selection of listings across San Fernando and ' +
    'surrounding areas in Pampanga.',
}

export default async function ListingsPage() {
  let featuredListings: PublicListing[] = []
  let fetchError = false

  try {
    // Dedicated query — only fetches flagged featured rows (uses partial index)
    // Falls back to newest 6 if none are flagged
    featuredListings = await getFeaturedListings()
  } catch {
    fetchError = true
  }
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <MaintenanceBanner />

      {/* Page header */}
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--est-purple)' }}>
          Browse
        </p>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--est-text)' }}>
          Properties for Sale &amp; Rent
        </h1>
        <p className="text-sm" style={{ color: 'var(--est-muted)' }}>
          House and lot, lot only, and commercial properties across Pampanga.
        </p>
      </div>

      {fetchError ? (
        <div
          className="py-20 text-center rounded-2xl"
          style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--est-muted)' }}>
            Unable to load listings. Please try again later.
          </p>
        </div>
      ) : (
        <>
          {/* Search filter + featured cards */}
          <FeaturedSearchSection
            featuredListings={featuredListings}
          />

          {/* Facebook video — shown when admin has configured a featured video URL */}
          <FeaturedVideoSection />

          {/* CTA — Book a viewing / Agent of the day / Messenger */}
          <BookingCTASection />
        </>
      )}
    </main>
  )
}
