// app/(public)/listings/page.tsx — Estatein dark theme
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PublicListing } from '@/lib/types/public'
import ListingsClientWrapper from '@/app/(public)/components/ListingsClientWrapper'
import ListingCard from '@/app/(public)/components/ListingCard'
import MaintenanceBanner from '@/app/(public)/components/MaintenanceBanner'
import { getCachedPublicListings } from '@/lib/listings/publicListings'

export const dynamic = 'force-static'
export const revalidate = 60 // rebuild cached page at most once per minute

export const metadata: Metadata = {
  title: 'Properties for Sale & Rent – M. Liang Realty',
  description:
    'Browse house and lot, lot only, and commercial properties in Pampanga. ' +
    'M. Liang Realty offers a wide selection of listings across San Fernando and ' +
    'surrounding areas in Pampanga.',
}

export default async function ListingsPage() {
  let listings: PublicListing[] = []
  let featuredListings: PublicListing[] = []
  let fetchError = false

  try {
    const allListings = await getCachedPublicListings()
    listings = allListings
    featuredListings = allListings.filter((listing) => listing.price !== null || listing.previewPhoto !== null).slice(0, 6)
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
          <ListingsClientWrapper allListings={listings} />

          <section className="mt-14 rounded-3xl p-6 sm:p-8" style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--est-purple)' }}>
                  Hand-Picked
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--est-text)' }}>
                  Featured Properties
                </h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--est-muted)' }}>
                  Highlighted homes and lots that stand out for their value, location, or presentation.
                </p>
              </div>
              <Link href="/listings" className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80" style={{ color: 'var(--est-purple)' }}>
                View all listings <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {featuredListings.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--est-muted)' }}>
                Featured properties will appear here soon.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredListings.map((listing, idx) => (
                  <ListingCard key={listing.id} listing={listing} priority={idx === 0} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
