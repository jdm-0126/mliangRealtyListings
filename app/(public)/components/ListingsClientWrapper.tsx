'use client'

import { useMemo, useState, useEffect, useDeferredValue } from 'react'
import { PublicListing } from '@/lib/types/public'
import ListingCard from './ListingCard'
import { SlidersHorizontal, X, LayoutList, LayoutGrid } from 'lucide-react'

import {
  DEFAULT_PAGE_SIZE,
  PROPERTY_TYPES,
  PRICE_RANGES,
  STORAGE_KEYS,
} from '@/lib/shared/constantz'
interface ListingsClientWrapperProps {
  allListings: PublicListing[]
  initialType?: string
  initialLocation?: string
  initialPrice?: string
  initialMode?: string
  initialPage?: string
}


const PAGE_SIZE = DEFAULT_PAGE_SIZE

const TYPE_OPTIONS = PROPERTY_TYPES
const PRICE_RANGE_OPTIONS = PRICE_RANGES

const SETTINGS_KEY = STORAGE_KEYS.SETTINGS
const VIEW_MODE_KEY = STORAGE_KEYS.PUBLIC_VIEW_MODE

function normalizeListingType(type?: string | null): string {
  const value = (type ?? '').trim().toLowerCase()
  if (!value) return ''
  if (value.includes('commercial')) return 'Commercial'
  if (value.includes('house') || value.includes('residential')) return 'House and Lot'
  if (value.includes('lot only') || value === 'lot') return 'Lot only'
  if (value.includes('lot')) return 'Lot only'
  return type?.trim() || ''
}

function getSearchableLocation(listing: PublicListing): string {
  return [listing.location, listing.village].filter(Boolean).join(' ').trim().toLowerCase()
}

type TypeFilter = (typeof TYPE_OPTIONS)[number]
type PriceRange = (typeof PRICE_RANGE_OPTIONS)[number]
type ModeFilter = 'All' | 'For Sale' | 'For Rent'
type ViewMode = 'list' | 'grid'

const MODE_OPTIONS: ModeFilter[] = ['All', 'For Sale', 'For Rent']

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

export default function ListingsClientWrapper({ allListings, initialType, initialLocation, initialPrice, initialMode }: ListingsClientWrapperProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(
    TYPE_OPTIONS.includes(initialType as TypeFilter) ? (initialType as TypeFilter) : 'All'
  )
  const [locationQuery, setLocationQuery] = useState(initialLocation ?? '')
  const [villageQuery, setVillageQuery] = useState(initialLocation ?? '')
  const deferredLocation = useDeferredValue(locationQuery)
  const [priceRange, setPriceRange] = useState<PriceRange>(
    PRICE_RANGE_OPTIONS.includes(initialPrice as PriceRange) ? (initialPrice as PriceRange) : 'All'
  )
  const [modeFilter, setModeFilter] = useState<ModeFilter>(
    MODE_OPTIONS.includes(initialMode as ModeFilter) ? (initialMode as ModeFilter) : 'All'
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // Read view mode preference after hydration (localStorage is client-only)
  useEffect(() => {
    try {
      const personal = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null
      if (personal === 'grid' || personal === 'list') { setViewMode(personal); return }
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
      if (settings.publicListingsViewMode === 'grid') setViewMode('grid')
    } catch { /* keep default */ }
  }, [])

  // useMemo — filter runs when deferred value settles (decouples typing from filter)
  // For initial URL params, use locationQuery directly so results show immediately.
    const filteredListings = useMemo(() => {
      console.log("Filtering...", {
      currentPage,
      typeFilter,
      locationQuery,
      villageQuery,
      priceRange,
      modeFilter,
    });
    // Use the non-deferred value for initial render (prop-driven), deferred for typing
    const locationToFilter = deferredLocation || locationQuery
    const normalizedQuery = locationToFilter.trim().toLowerCase()

    return (allListings ?? []).filter(listing => {
      const normalizedType = normalizeListingType(listing.type)
      if (typeFilter !== 'All' && normalizedType !== typeFilter) return false
      if (normalizedQuery && !getSearchableLocation(listing).includes(normalizedQuery)) return false
      const price = listing.price ?? 0
      if (priceRange === 'Under ₱2M' && price >= 2_000_000) return false
      if (priceRange === '₱2M–₱5M' && (price < 2_000_000 || price >= 5_000_000)) return false
      if (priceRange === '₱5M–₱10M' && (price < 5_000_000 || price >= 10_000_000)) return false
      if (priceRange === 'Above ₱10M' && price < 10_000_000) return false
      if (modeFilter === 'For Sale' && (listing.listingMode ?? '').toLowerCase().includes('rent')) return false
      if (modeFilter === 'For Rent' && !(listing.listingMode ?? '').toLowerCase().includes('rent')) return false
      return true
    })
  }, [allListings, typeFilter, deferredLocation, locationQuery, villageQuery, priceRange, modeFilter])

  const paginatedListings = filteredListings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE)
  const showPagination = filteredListings.length > PAGE_SIZE
  const hasActiveFilters = typeFilter !== 'All' || locationQuery.trim() !== '' || villageQuery.trim() !== '' || priceRange !== 'All' || modeFilter !== 'All'

  function handleTypeFilter(v: TypeFilter) {
  console.log("Type changed:", v);
  setTypeFilter(v);
  setCurrentPage(1);
  }
  function handleLocationQuery(v: string) { setLocationQuery(v); setCurrentPage(1) }
  function handleVillageQuery(v: string) { setVillageQuery(v); setCurrentPage(1) }
  function handlePriceRange(v: PriceRange) { setPriceRange(v); setCurrentPage(1) }
  function handleModeFilter(v: ModeFilter) { setModeFilter(v); setCurrentPage(1) }
  function clearFilters() { setTypeFilter('All'); setLocationQuery(''); setPriceRange('All'); setModeFilter('All'); setCurrentPage(1) }

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

  useEffect(() => {
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  } else if (totalPages === 0 && currentPage !== 1) {
    setCurrentPage(1);
  }
}, [currentPage, totalPages]);

  return (
    <div>
      {/* Filter bar */}
      <div
        className="rounded-2xl p-5 mb-6 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end"
        style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}
      >
        {/* Header row — filter label + clear + view toggle */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--est-purple)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--est-text)' }}>
              Filter Listings
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors hover:opacity-80 ml-2"
                style={{ background: 'var(--est-elevated)', color: 'var(--est-muted)', border: '1px solid var(--est-border)' }}
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--est-border)' }}
            role="group"
            aria-label="View mode"
          >
            <button
              onClick={() => { setViewMode('list'); try { localStorage.setItem(VIEW_MODE_KEY, 'list') } catch { /* */ } }}
              aria-pressed={viewMode === 'list'}
              title="List view"
              className="flex items-center justify-center w-8 h-8 transition-all"
              style={{
                background: viewMode === 'list' ? 'var(--est-purple)' : 'var(--est-elevated)',
                color: viewMode === 'list' ? '#fff' : 'var(--est-muted)',
              }}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode('grid'); try { localStorage.setItem(VIEW_MODE_KEY, 'grid') } catch { /* */ } }}
              aria-pressed={viewMode === 'grid'}
              title="Grid view"
              className="flex items-center justify-center w-8 h-8 transition-all"
              style={{
                background: viewMode === 'grid' ? 'var(--est-purple)' : 'var(--est-elevated)',
                color: viewMode === 'grid' ? '#fff' : 'var(--est-muted)',
              }}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
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
        <div className="flex-[2] min-w-[200px]">
          <label htmlFor="location-query" style={labelStyle}>Village</label>
          <input
            id="location-query"
            type="text"
            placeholder="Search by village…"
            value={villageQuery}
            onChange={e => handleVillageQuery(e.target.value)}
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

        {/* For Sale / For Rent */}
        <div className="min-w-[140px] flex-1">
          <label htmlFor="mode-filter" style={labelStyle}>Listing</label>
          <select
            id="mode-filter"
            value={modeFilter}
            onChange={e => handleModeFilter(e.target.value as ModeFilter)}
            style={selectStyle}
          >
            {MODE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Results count */}
      {filteredListings.length > 0 && (
        <p className="text-sm mb-5" style={{ color: 'var(--est-muted)' }}>
          Showing{' '}
          <span style={{ color: 'var(--est-text)', fontWeight: 600 }}>{paginatedListings.length}</span>
          {' '}of{' '}
          <span style={{ color: 'var(--est-text)', fontWeight: 600 }}>{filteredListings.length}</span>
          {' '}propert{filteredListings.length === 1 ? 'y' : 'ies'}
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

      {/* Listings — list or grid */}
      {filteredListings.length > 0 && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {paginatedListings.map((listing, idx) => (
              <ListingCard key={`${listing.property_id}-${viewMode}`} listing={listing} viewMode="grid" priority={idx === 0} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-10">
            {paginatedListings.map((listing, idx) => (
              <ListingCard
                key={`${listing.id}-${idx}`}
                listing={listing}
                viewMode="list"
                priority={idx === 0}
              />
            ))}
          </div>
        )
      )}

      {/* Pagination */}
      {showPagination && (
        <nav aria-label="Listings pagination" className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
            style={{ background: 'var(--est-elevated)', color: 'var(--est-subtle)', border: '1px solid var(--est-border)' }}
          >
            ← Prev
          </button>

          {getPaginationItems().map((item) =>
            item === 'ellipsis-start' || item === 'ellipsis-end' ? (
              <span key={item} className="px-2 text-sm" style={{ color: 'var(--est-muted)' }}>…</span>
            ) : (
              <button
                key={`page-${item}`}
                onClick={() => setCurrentPage(item)}
                aria-label={`Page ${item}`}
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
            aria-label="Next page"
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
