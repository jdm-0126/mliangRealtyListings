'use client'

import { useMemo, useState } from 'react'
import { PublicListing } from '@/lib/types/public'
import ListingCard from './ListingCard'
import { SlidersHorizontal, X } from 'lucide-react'

interface ListingsClientWrapperProps {
  allListings: PublicListing[]
}

const PAGE_SIZE = 12

const TYPE_OPTIONS = ['All', 'House & Lot', 'Lot Only', 'Commercial'] as const
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

export default function ListingsClientWrapper({ allListings }: ListingsClientWrapperProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All')
  const [locationQuery, setLocationQuery] = useState('')
  const [priceRange, setPriceRange] = useState<PriceRange>('All')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredListings = useMemo(() => {
    return allListings.filter(listing => {
      if (typeFilter !== 'All' && listing.type !== typeFilter) return false
      if (locationQuery.trim() && !listing.location.toLowerCase().includes(locationQuery.toLowerCase())) return false
      const price = listing.price ?? 0
      if (priceRange === 'Under ₱2M' && price >= 2_000_000) return false
      if (priceRange === '₱2M–₱5M' && (price < 2_000_000 || price >= 5_000_000)) return false
      if (priceRange === '₱5M–₱10M' && (price < 5_000_000 || price >= 10_000_000)) return false
      if (priceRange === 'Above ₱10M' && price < 10_000_000) return false
      return true
    })
  }, [allListings, typeFilter, locationQuery, priceRange])

  const paginatedListings = filteredListings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE)
  const showPagination = filteredListings.length > PAGE_SIZE
  const hasActiveFilters = typeFilter !== 'All' || locationQuery.trim() !== '' || priceRange !== 'All'

  function handleTypeFilter(v: TypeFilter) { setTypeFilter(v); setCurrentPage(1) }
  function handleLocationQuery(v: string) { setLocationQuery(v); setCurrentPage(1) }
  function handlePriceRange(v: PriceRange) { setPriceRange(v); setCurrentPage(1) }
  function clearFilters() { setTypeFilter('All'); setLocationQuery(''); setPriceRange('All'); setCurrentPage(1) }

  function getPaginationItems(): (number | 'ellipsis-start' | 'ellipsis-end')[] {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const items: (number | 'ellipsis-start' | 'ellipsis-end')[] = [1]
    const windowStart = Math.max(2, currentPage - 1)
    const windowEnd = Math.min(totalPages - 1, currentPage + 1)
    const clampedStart = Math.max(2, Math.min(windowStart, totalPages - 4))
    const clampedEnd = Math.min(totalPages - 1, Math.max(windowEnd, 4))
    if (clampedStart > 2) items.push('ellipsis-start')
    for (let p = clampedStart; p <= clampedEnd; p++) items.push(p)
    if (clampedEnd < totalPages - 1) items.push('ellipsis-end')
    items.push(totalPages)
    return items
  }

  return (
    <div>
      {/* Filter bar */}
      <div
        className="rounded-2xl p-5 mb-8 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end"
        style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--est-purple)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--est-text)' }}>
              Filter Listings
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
            onChange={e => handleTypeFilter(e.target.value as TypeFilter)}
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
            onChange={e => handleLocationQuery(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Price range */}
        <div className="min-w-[180px] flex-1">
          <label htmlFor="price-range" style={labelStyle}>Price Range</label>
          <select
            id="price-range"
            value={priceRange}
            onChange={e => handlePriceRange(e.target.value as PriceRange)}
            style={selectStyle}
          >
            {PRICE_RANGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Results count */}
      {filteredListings.length > 0 && (
        <p className="text-sm mb-6" style={{ color: 'var(--est-muted)' }}>
          Showing <span style={{ color: 'var(--est-text)', fontWeight: 600 }}>{paginatedListings.length}</span> of{' '}
          <span style={{ color: 'var(--est-text)', fontWeight: 600 }}>{filteredListings.length}</span>{' '}
          propert{filteredListings.length === 1 ? 'y' : 'ies'}
        </p>
      )}

      {/* Empty state */}
      {filteredListings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
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
          <p className="text-sm mb-6" style={{ color: 'var(--est-muted)' }}>Try adjusting your filters.</p>
          <button
            onClick={clearFilters}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'var(--est-purple)', color: '#fff' }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Grid */}
      {filteredListings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {paginatedListings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {showPagination && (
        <nav aria-label="Listings pagination" className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
            style={{ background: 'var(--est-elevated)', color: 'var(--est-subtle)', border: '1px solid var(--est-border)' }}
          >
            ← Prev
          </button>

          {getPaginationItems().map((item, idx) =>
            item === 'ellipsis-start' || item === 'ellipsis-end' ? (
              <span key={item} className="px-2 text-sm" style={{ color: 'var(--est-muted)' }}>…</span>
            ) : (
              <button
                key={`page-${item}`}
                onClick={() => setCurrentPage(item)}
                aria-current={currentPage === item ? 'page' : undefined}
                className="min-w-[38px] h-9 rounded-lg text-sm font-medium transition-all"
                style={
                  currentPage === item
                    ? { background: 'var(--est-purple)', color: '#fff', border: '1px solid var(--est-purple)' }
                    : { background: 'var(--est-elevated)', color: 'var(--est-subtle)', border: '1px solid var(--est-border)' }
                }
              >
                {item}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
            style={{ background: 'var(--est-elevated)', color: 'var(--est-subtle)', border: '1px solid var(--est-border)' }}
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  )
}
