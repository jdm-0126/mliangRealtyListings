// app/(public)/for-sale/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PublicListing } from '@/lib/types/public'
import ListingsClientWrapper from '@/app/(public)/components/ListingsClientWrapper'
import MaintenanceBanner from '@/app/(public)/components/MaintenanceBanner'
import { getSlimPublicListings } from '@/lib/listings/publicListings'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Properties for Sale – M. Liang Realty',
  description:
    'Browse house and lot, lot only, and commercial properties for sale in Pampanga. ' +
    'M. Liang Realty offers a wide selection of listings across San Fernando and surrounding areas.',
}

interface Props {
  searchParams: Promise<{ type?: string; location?: string; price?: string }>
}

export default async function ForSalePage({ searchParams }: Props) {
  const { type, location, price } = await searchParams
  let listings: PublicListing[] = []
  let fetchError = false

  try {
    const all = await getSlimPublicListings()
    listings = all.filter(l =>
      !l.listingMode || l.listingMode.toLowerCase().includes('sale')
    )
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
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--est-purple)' }}>
          For Sale
        </p>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--est-text)' }}>
          Properties for Sale
        </h1>
        <p className="text-sm" style={{ color: 'var(--est-muted)' }}>
          House and lot, lot only, and commercial properties for sale across Pampanga.
        </p>
      </div>

      {fetchError ? (
        <div className="py-20 text-center rounded-2xl" style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}>
          <p className="text-sm" style={{ color: 'var(--est-muted)' }}>Unable to load listings. Please try again later.</p>
        </div>
      ) : (
        <ListingsClientWrapper
          allListings={listings}
          initialType={type}
          initialLocation={location}
          initialPrice={price}
          initialMode="For Sale"
        />
      )}
    </main>
  )
}
