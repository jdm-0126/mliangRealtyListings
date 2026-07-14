// app/(public)/listings/all/page.tsx — Full paginated listings browser
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PublicListing } from '@/lib/types/public'
import ListingsClientWrapper from '@/app/(public)/components/ListingsClientWrapper'
import MaintenanceBanner from '@/app/(public)/components/MaintenanceBanner'
import { getSlimPublicListings } from '@/lib/listings/publicListings'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'All Properties – M. Liang Realty',
  description:
    'Browse the complete list of house and lot, lot only, and commercial properties ' +
    'for sale and rent in Pampanga. Filter by type, location, village and price.',
}

interface Props {
  searchParams: Promise<{ type?: string; location?: string; price?: string; mode?: string }>
}

export default async function AllListingsPage({ searchParams }: Props) {
  const { type, location, price, mode } = await searchParams
  let listings: PublicListing[] = []
  let fetchError = false

  try {
    listings = await getSlimPublicListings()
  } catch {
    fetchError = true
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <MaintenanceBanner />

      <Link
        href="/listings"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-colors hover:opacity-70"
        style={{ color: 'var(--est-muted)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Featured
      </Link>

      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--Eest-purple)' }}>
          All Listings
        </p>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--est-text)' }}>
          Browse All Properties
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
        <ListingsClientWrapper
          allListings={listings}
          initialType={type}
          initialLocation={location}
          initialPrice={price}
          initialMode={mode}
        />
      )}
    </main>
  )
}
