// app/(public)/listings/page.tsx — Estatein dark theme
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { supabase } from '@/app/lib/supabaseClient'
import { PublicListing } from '@/lib/types/public'
import ListingsClientWrapper from '@/app/(public)/components/ListingsClientWrapper'

export const metadata: Metadata = {
  title: 'Properties for Sale & Rent – M. Liang Realty',
  description:
    'Browse house and lot, lot only, and commercial properties in Pampanga. ' +
    'M. Liang Realty offers a wide selection of listings across San Fernando and ' +
    'surrounding areas in Pampanga.',
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

function mapToPublicListing(row: Record<string, unknown>): PublicListing {
  const id = Number(row['Property ID'])
  const photos: string[] = []
  for (let i = 1; i <= 20; i++) {
    const photo = row[`Photo ${i}`]
    if (typeof photo === 'string' && photo.trim()) photos.push(photo.trim())
  }
  return {
    id, displayId: id > 2 ? id - 1 : id,
    type: String(row['Type'] ?? ''), location: String(row['Location'] ?? ''),
    village: typeof row['Village'] === 'string' ? row['Village'] : undefined,
    price: parsePrice(row['Listing Price'] ?? row['ListingPrice'] ?? row['Price']),
    lotArea: parseArea(row['Lot Area'] ?? row['Lot Area sqm'] ?? row['LA']),
    floorArea: parseArea(row['Floor Area'] ?? row['Floor Area sqm']),
    bedrooms: parseArea(row['Bedroom']), bathrooms: parseArea(row['Bathroom']),
    previewPhoto: typeof row['Preview Photo'] === 'string' && row['Preview Photo'].trim() ? row['Preview Photo'].trim() : null,
    photos, notes: String(row['Notes'] ?? ''), status: String(row['Status'] ?? ''),
    updatedAt: typeof row['updated_at'] === 'string' ? row['updated_at'] : undefined,
  }
}

export default async function ListingsPage() {
  let listings: PublicListing[] = []
  let fetchError = false

  if (supabase) {
    const { data, error } = await supabase
      .from('mlianglistings').select('*').ilike('Status', 'active')
      .order('Property ID', { ascending: false })
    if (error) { fetchError = true }
    else {
      listings = (data ?? [])
        .map((row: Record<string, unknown>) => mapToPublicListing(row))
        .filter((l: PublicListing) => l.price !== null || l.previewPhoto !== null)
    }
  } else { fetchError = true }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
        <ListingsClientWrapper allListings={listings} />
      )}
    </main>
  )
}
