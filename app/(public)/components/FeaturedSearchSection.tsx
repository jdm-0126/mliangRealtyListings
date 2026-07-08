'use client'
// app/(public)/components/FeaturedSearchSection.tsx
// Shows the search/filter bar + featured listings grid.
// The full listings list (all properties paginated) is intentionally NOT shown here.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, SlidersHorizontal, X } from 'lucide-react'
import { PublicListing } from '@/lib/types/public'
import ListingCard from './ListingCard'

interface FeaturedSearchSectionProps {
  allListings: PublicListing[]      // full set — used to filter featured subset
  featuredListings: PublicListing[] // pre-selected featured (up to 6)
}

const TYPE_OPTIONS = ['All', 'House and Lot', 'Lot only', 'Commercial'] as const
const PRICE_RANGE_OPTIONS = ['All', 'Under ₱2M', '₱2M–₱5M', '₱5M–₱10M', 'Above ₱10M'] as const

type TypeFilter = (typeof TYPE_OPTIONS)[number]
type PriceRange = (typeof PRICE_RANGE_OPTIONS)[number]

function normalizeType(type?: string | null): string {
  const v = (type ?? '').trim().toLowerCase()
  if (!v) return ''
  if (v.includes('commercial')) return 'Commercial'
  if (v.includes('house') || v.includes('residential')) return 'House and Lot'
  if (v.includes('lot only') || v === 'lot') return 'Lot only'
  if (v.includes('lot')) return 'Lot only'
  return type?.trim() || ''
}

const selectStyle: React.CSSProperties = {
  background: 'var(--est-elevated)',
  border: '1px solid var(--est-border)',
  color: 'var(--est-text)',
  borderRadius: '0.5rem',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--est-elevated)',
  border: '1px solid var(--est-border)',
  color: 'var(--est-text)',
  borderRadius: '0.5rem',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.375rem',
  color: 'var(--est-muted)',
}

export default function FeaturedSearchSection({ allListings, featuredListings }: FeaturedSearchSectionProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All')
  const [locationQuery, setLocationQuery] = useState('')
  const [priceRange, setPriceRange] = useState<PriceRange>('All')

  const hasActiveFilters = typeFilter !== 'All' || locationQuery.trim() !== '' || priceRange !== 'All'

  // When no filters active → show the featured picks.
  // When filters active → search across ALL listings (not just featured).
  const displayListings = useMemo(() => {
    if (!hasActiveFilters) return featuredListings

    return allListings.filter(listing => {
      const normalizedType = normalizeType(listing.type)
      if (typeFilter !== 'All' && normalizedType !== typeFilter) return false
      if (locationQuery.trim() && !listing.location.toLowerCase().includes(locationQuery.toLowerCase())) return false
      const price = listing.price ?? 0
      if (priceRange === 'Under ₱2M' && price >= 2_000_000) return false
      if (priceRange === '₱2M–₱5M' && (price < 2_000_000 || price >= 5_000_000)) return false
      if (priceRange === '₱5M–₱10M' && (price < 5_000_000 || price >= 10_000_000)) return false
      if (priceRange === 'Above ₱10M' && price < 10_000_000) return false
      return true
    }).slice(0, 12) // cap at 12 in search mode — link to /listings for full browse
  }, [allListings, featuredListings, hasActiveFilters, typeFilter, locationQuery, priceRange])

  function clearFilters() {
    setTypeFilter('All')
    setLocationQuery('')
    setPriceRange('All')
  }

  return (
    <>
      {/* ── Search / filter bar ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 mb-10 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end"
        style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}
      >
        {/* Label + clear */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--est-purple)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--est-text)' }}>
              Search Properties
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors hover:opacity-80"
              style={{ background: 'var(--est-elevated)', color: 'var(--est-muted)', border: '1px solid var(--est-border)' }}
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Property type */}
        <div className="min-w-[160px] flex-1">
          <label htmlFor="type-filter" style={labelStyle}>Property Type</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as TypeFilter)}
            style={selectStyle}
          >
            {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Location */}
        <div className="flex-[2] min-w-[200px]">
          <label htmlFor="location-query" style={labelStyle}>Location</label>
          <input
            id="location-query"
            type="text"
            placeholder="Search by location…"
            value={locationQuery}
            onChange={e => setLocationQuery(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Price range */}
        <div className="min-w-[180px] flex-1">
          <label htmlFor="price-range" style={labelStyle}>Price Range</label>
          <select
            id="price-range"
            value={priceRange}
            onChange={e => setPriceRange(e.target.value as PriceRange)}
            style={selectStyle}
          >
            {PRICE_RANGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* ── Featured / search results ───────────────────────────────────── */}
      <section className="rounded-3xl p-6 sm:p-8" style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            {hasActiveFilters ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--est-purple)' }}>
                  Search Results
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--est-text)' }}>
                  {displayListings.length} propert{displayListings.length === 1 ? 'y' : 'ies'} found
                </h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--est-muted)' }}>
                  Showing top matches. Browse all results on the full listings page.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--est-purple)' }}>
                  Hand-Picked
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--est-text)' }}>
                  Featured Properties
                </h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--est-muted)' }}>
                  Highlighted homes and lots that stand out for their value, location, or presentation.
                </p>
              </>
            )}
          </div>
          <Link
            href="/listings/all"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80 whitespace-nowrap"
            style={{ color: 'var(--est-purple)' }}
          >
            Browse all listings <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Empty state */}
        {displayListings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'var(--est-elevated)', border: '1px solid var(--est-border)' }}
            >
              <svg className="w-8 h-8" style={{ color: 'var(--est-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 22V12h6v10" />
              </svg>
            </div>
            <p className="text-base font-semibold mb-2" style={{ color: 'var(--est-text)' }}>No properties match your search</p>
            <p className="text-sm mb-6" style={{ color: 'var(--est-muted)' }}>Try adjusting your filters or browse all listings.</p>
            <div className="flex gap-3">
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'var(--est-elevated)', color: 'var(--est-text)', border: '1px solid var(--est-border)' }}
              >
                Clear Filters
              </button>
              <Link
                href="/listings/all"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'var(--est-purple)', color: '#fff' }}
              >
                Browse All
              </Link>
            </div>
          </div>
        )}

        {/* Cards */}
        {displayListings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayListings.map((listing, idx) => (
              <ListingCard key={listing.id} listing={listing} viewMode="grid" priority={idx === 0} />
            ))}
          </div>
        )}

        {/* Prompt to see all results when filter is active */}
        {hasActiveFilters && displayListings.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/listings/all"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'var(--est-purple)', color: '#fff' }}
            >
              See all matching properties <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>
    </>
  )
}
