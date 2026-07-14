'use client'
// app/(public)/components/FeaturedSearchSection.tsx

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, SlidersHorizontal, Search } from 'lucide-react'
import { PublicListing } from '@/lib/types/public'
import ListingCard from './ListingCard'

interface FeaturedSearchSectionProps {
  featuredListings: PublicListing[]
}

const TYPE_OPTIONS = ['All', 'House and Lot', 'Lot only', 'Commercial'] as const
const PRICE_RANGE_OPTIONS = ['All', 'Under ₱2M', '₱2M–₱5M', '₱5M–₱10M', 'Above ₱10M'] as const

type TypeFilter = (typeof TYPE_OPTIONS)[number]
type PriceRange = (typeof PRICE_RANGE_OPTIONS)[number]

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

export default function FeaturedSearchSection({ featuredListings = [] }: FeaturedSearchSectionProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All')
  const [locationQuery, setLocationQuery] = useState('')
  const [villageQuery, setVillageQuery] = useState('')
  const [priceRange, setPriceRange] = useState<PriceRange>('All')
  const [modeFilter, setModeFilter] = useState<'All' | 'For Sale' | 'For Rent'>('All')

  function buildSearchUrl() {
    const params = new URLSearchParams()
    if (typeFilter !== 'All') params.set('type', typeFilter)
    if (locationQuery.trim()) params.set('location', locationQuery.trim())
    if (villageQuery.trim()) params.set('village', villageQuery.trim())
    if (priceRange !== 'All') params.set('price', priceRange)
    if (modeFilter !== 'All') params.set('mode', modeFilter)
    const qs = params.toString()
    return `/listings/all${qs ? `?${qs}` : ''}`
  }

  return (
    <>
      {/* ── Search bar — GET form navigates to /listings/all ── */}
      <div
        className="rounded-2xl p-5 mb-10 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end"
        style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}
      >
        <div className="flex items-center gap-2 w-full">
          <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--est-purple)' }} />
          <p className="text-sm font-semibold m-0" style={{ color: 'var(--est-text)' }}>
            Search Properties
          </p>
        </div>

        {/* Property type */}
        <div className="min-w-[160px] flex-1">
          <label htmlFor="fs-type-filter" style={labelStyle}>Property Type</label>
          <select
            id="fs-type-filter"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as TypeFilter)}
            style={selectStyle}
          >
            {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Location */}
        <div className="flex-[2] min-w-[200px]">
          <label htmlFor="fs-location-query" style={labelStyle}>Location</label>
          <input
            id="fs-location-query"
            type="text"
            placeholder="Search by location…"
            value={locationQuery}
            onChange={e => setLocationQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') window.location.href = buildSearchUrl() }}
            style={inputStyle}
          />
        </div>
        {/* Village */}
        <div className="flex-[2] min-w-[200px]">
          <label htmlFor="fs-location-query" style={labelStyle}>Village</label>
          <input
            id="fs-village-query"
            type="text"
            placeholder="Search by village…"
            value={villageQuery}
            onChange={e => setVillageQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') window.location.href = buildSearchUrl() }}
            style={inputStyle}
          />
        </div>

        {/* Price range */}
        <div className="min-w-[180px] flex-1">
          <label htmlFor="fs-price-range" style={labelStyle}>Price Range</label>
          <select
            id="fs-price-range"
            value={priceRange}
            onChange={e => setPriceRange(e.target.value as PriceRange)}
            style={selectStyle}
          >
            {PRICE_RANGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* For Sale / For Rent */}
        <div className="min-w-[140px] flex-1">
          <label htmlFor="fs-mode-filter" style={labelStyle}>Listing</label>
          <select
            id="fs-mode-filter"
            value={modeFilter}
            onChange={e => setModeFilter(e.target.value as 'All' | 'For Sale' | 'For Rent')}
            style={selectStyle}
          >
            <option value="All">All</option>
            <option value="For Sale">For Sale</option>
            <option value="For Rent">For Rent</option>
          </select>
        </div>

        {/* Search button */}
        <div className="flex-shrink-0">
          <Link
            href={buildSearchUrl()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'var(--est-purple)', color: '#fff', height: 38, display: 'inline-flex', alignItems: 'center' }}
          >
            <Search className="w-4 h-4" /> Search
          </Link>
        </div>
      </div>

      {/* ── Featured listings ── */}
      <section className="rounded-3xl p-6 sm:p-8" style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}>
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
          {/* <Link
            href="/listings/all"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80 whitespace-nowrap"
            style={{ color: 'var(--est-purple)' }}
          >
            Browse all listings <ArrowRight className="w-4 h-4" />
          </Link> */}
        </div>

        {(featuredListings?.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: 'var(--est-muted)' }}>
            Featured properties will appear here soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featuredListings ?? []).map((listing, idx) => (
              <ListingCard key={listing.property_id} listing={listing} viewMode="grid" priority={idx === 0} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
