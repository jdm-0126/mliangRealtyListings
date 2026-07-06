// app/(public)/page.tsx
// Server Component — no 'use client'

import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/app/lib/supabaseClient'
import { PublicListing } from '@/lib/types/public'
import { getTenantSettingsServer } from '@/lib/tenantServer'
import { buildLocalBusinessJsonLd } from '@/lib/seo/jsonld'
import ListingCard from '@/app/(public)/components/ListingCard'
import SocialLinks from '@/app/(public)/components/SocialLinks'
import JsonLd from '@/app/(public)/components/JsonLd'

// Always fetch fresh — featured listings can change any time from admin
export const dynamic = 'force-dynamic'
export const revalidate = 0

// ---------------------------------------------------------------------------
// Metadata (Tasks 8.1 SEO)
// ---------------------------------------------------------------------------

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
  twitter: {
    card: 'summary_large_image',
    title: 'M. Liang Realty – Houses, Lots & Condos in Pampanga',
    description: OG_DESCRIPTION,
    images: ['/og-image.svg'],
  },
  alternates: { canonical: 'https://realtyprov1.com' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a price value that may be a number, a formatted string like "3,500,000", or null/undefined. */
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

// ---------------------------------------------------------------------------
// Data mapping
// ---------------------------------------------------------------------------

function mapListing(row: Record<string, unknown>): PublicListing {
  const id = Number(row['Property ID'])
  return {
    id,
    displayId: id > 2 ? id - 1 : id,
    type: String(row['Type'] ?? ''),
    location: String(row['Location'] ?? ''),
    village: row['Village'] ? String(row['Village']) : undefined,
    price: parsePrice(row['Listing Price'] ?? row['ListingPrice'] ?? row['Price']),
    lotArea: parseArea(row['Lot Area'] ?? row['Lot Area sqm'] ?? row['LA']),
    floorArea: parseArea(row['Floor Area'] ?? row['Floor Area sqm']),
    bedrooms: parseArea(row['Bedroom']),
    bathrooms: parseArea(row['Bathroom']),
    previewPhoto: row['Preview Photo'] ? String(row['Preview Photo']) : null,
    photos: [],
    notes: String(row['Notes'] ?? ''),
    status: String(row['Status'] ?? ''),
    updatedAt: row['updated_at'] ? String(row['updated_at']) : undefined,
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function HomePage() {
  const settings = getTenantSettingsServer()

  // Fetch featured listings (admin-selected), pad with newest active if fewer than 6
  let listings: PublicListing[] = []
  let fetchError = false
  let isFeaturedSet = false

  if (supabase) {
    // 1. Get all featured active listings (up to 6)
    const { data: featuredData, error: featuredError } = await supabase
      .from('mlianglistings')
      .select('*')
      .ilike('Status', 'active')
      .eq('featured', true)
      .order('Property ID', { ascending: false })
      .limit(6)

    if (featuredError) {
      fetchError = true
    } else {
      const featured = (featuredData ?? [])
        .map((row: Record<string, unknown>) => mapListing(row))
        .filter((l: PublicListing) => l.price !== null || l.previewPhoto !== null)

      if (featured.length === 6) {
        // Full set — use as-is
        isFeaturedSet = true
        listings = featured
      } else if (featured.length > 0) {
        // Partial — pad with newest non-featured active listings
        isFeaturedSet = true
        const featuredIds = featured.map(l => l.id)
        const needed = 6 - featured.length

        const { data: padData } = await supabase
          .from('mlianglistings')
          .select('*')
          .ilike('Status', 'active')
          .not('Property ID', 'in', `(${featuredIds.join(',')})`)
          .order('Property ID', { ascending: false })
          .limit(needed * 3) // fetch extra to account for incomplete listings

        const padded = (padData ?? [])
          .map((row: Record<string, unknown>) => mapListing(row))
          .filter((l: PublicListing) => l.price !== null || l.previewPhoto !== null)
          .slice(0, needed)

        listings = [...featured, ...padded]
      } else {
        // No featured at all — fall back to newest 6 active
        const { data: newestData, error: newestError } = await supabase
          .from('mlianglistings')
          .select('*')
          .ilike('Status', 'active')
          .order('Property ID', { ascending: false })
          .limit(18) // fetch extra to account for filtering

        if (newestError) {
          fetchError = true
        } else {
          listings = (newestData ?? [])
            .map((row: Record<string, unknown>) => mapListing(row))
            .filter((l: PublicListing) => l.price !== null || l.previewPhoto !== null)
            .slice(0, 6)
        }
      }
    }
  } else {
    fetchError = true
  }

  return (
    <>
      <JsonLd data={buildLocalBusinessJsonLd(settings)} />

      {/* ------------------------------------------------------------------ */}
      {/* Hero Section (Task 8.1)                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {settings.businessName}
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8">
            Your trusted partner for properties in Pampanga
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/listings"
              className="inline-block px-8 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Browse Listings
            </Link>
            <Link
              href="/contact"
              className="inline-block px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-700 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Featured Listings Section (Task 8.1)                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Featured Listings
          </h2>
          <p className="text-gray-500 text-center mb-10">
            {isFeaturedSet
              ? 'Hand-picked properties in Pampanga'
              : 'Latest properties available in Pampanga'}
          </p>

          {fetchError ? (
            <p className="text-center text-gray-500 py-12">
              Unable to load listings at this time.
            </p>
          ) : listings.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              No listings available at the moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/listings"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Listings
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Services Section (Task 8.4)                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Our Services
          </h2>
          <p className="text-gray-500 text-center mb-10">
            What we offer to buyers and investors in Pampanga
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Block 1 – Property Sales */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 22V12h6v10"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Property Sales
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We specialize in house and lot sales as well as commercial
                properties across Pampanga. Whether you are looking for a
                family home, a townhouse, or an investment commercial space,
                we have options suited to your budget and needs.
              </p>
            </div>

            {/* Block 2 – Rental Properties */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Rental Properties
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Looking for a place to rent in Pampanga? We offer a variety
                of residential rental units including houses, apartments, and
                condominiums in San Fernando and surrounding areas —
                perfect for individuals, families, and business professionals.
              </p>
            </div>

            {/* Block 3 – Lot Sales */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Lot Sales
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Build the home of your dreams on your terms. We offer
                lot-only properties in prime locations across Pampanga,
                giving you the freedom to design and construct a custom
                home that perfectly suits your lifestyle and vision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Social Media Row (Task 8.5)                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-10 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
            Follow us
          </p>
          <SocialLinks />
        </div>
      </section>
    </>
  )
}
