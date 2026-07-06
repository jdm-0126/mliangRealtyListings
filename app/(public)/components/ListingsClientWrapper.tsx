'use client'

import { useMemo, useState } from 'react'
import { PublicListing } from '@/lib/types/public'
import ListingCard from './ListingCard'

interface ListingsClientWrapperProps {
  allListings: PublicListing[]
}

const PAGE_SIZE = 12

const TYPE_OPTIONS = ['All', 'House & Lot', 'Lot Only', 'Commercial'] as const
const PRICE_RANGE_OPTIONS = ['All', 'Under ₱2M', '₱2M–₱5M', '₱5M–₱10M', 'Above ₱10M'] as const

type TypeFilter = (typeof TYPE_OPTIONS)[number]
type PriceRange = (typeof PRICE_RANGE_OPTIONS)[number]

export default function ListingsClientWrapper({ allListings }: ListingsClientWrapperProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All')
  const [locationQuery, setLocationQuery] = useState('')
  const [priceRange, setPriceRange] = useState<PriceRange>('All')
  const [currentPage, setCurrentPage] = useState(1)

  // Apply all filters via memoization
  const filteredListings = useMemo(() => {
    return allListings.filter(listing => {
      // Type filter
      if (typeFilter !== 'All' && listing.type !== typeFilter) return false
      // Location filter (case-insensitive substring)
      if (locationQuery.trim() && !listing.location.toLowerCase().includes(locationQuery.toLowerCase())) return false
      // Price filter
      const price = listing.price ?? 0
      if (priceRange === 'Under ₱2M' && price >= 2_000_000) return false
      if (priceRange === '₱2M–₱5M' && (price < 2_000_000 || price >= 5_000_000)) return false
      if (priceRange === '₱5M–₱10M' && (price < 5_000_000 || price >= 10_000_000)) return false
      if (priceRange === 'Above ₱10M' && price < 10_000_000) return false
      return true
    })
  }, [allListings, typeFilter, locationQuery, priceRange])

  // Paginated slice
  const paginatedListings = filteredListings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE)
  const showPagination = filteredListings.length > PAGE_SIZE

  // Reset page to 1 when any filter changes
  function handleTypeFilter(value: TypeFilter) {
    setTypeFilter(value)
    setCurrentPage(1)
  }

  function handleLocationQuery(value: string) {
    setLocationQuery(value)
    setCurrentPage(1)
  }

  function handlePriceRange(value: PriceRange) {
    setPriceRange(value)
    setCurrentPage(1)
  }

  function clearFilters() {
    setTypeFilter('All')
    setLocationQuery('')
    setPriceRange('All')
    setCurrentPage(1)
  }

  // Build windowed page items: always show first, last, current ±1, with ellipsis gaps
  // Maximum 4 numbered buttons visible at once
  function getPaginationItems(): (number | 'ellipsis-start' | 'ellipsis-end')[] {
    if (totalPages <= 6) {
      // Few enough pages — show all without ellipsis
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const items: (number | 'ellipsis-start' | 'ellipsis-end')[] = []

    // Always include first page
    items.push(1)

    // Window around current page: show currentPage-1 and currentPage+1
    const windowStart = Math.max(2, currentPage - 1)
    const windowEnd = Math.min(totalPages - 1, currentPage + 1)

    // Clamp so we never show more than 4 numbers total (1, window[0..2], last)
    const clampedStart = Math.max(2, Math.min(windowStart, totalPages - 4))
    const clampedEnd = Math.min(totalPages - 1, Math.max(windowEnd, 4))

    if (clampedStart > 2) items.push('ellipsis-start')

    for (let p = clampedStart; p <= clampedEnd; p++) {
      items.push(p)
    }

    if (clampedEnd < totalPages - 1) items.push('ellipsis-end')

    // Always include last page
    items.push(totalPages)

    return items
  }

  return (
    <div>
      {/* Filter controls bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        {/* Property type filter */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label htmlFor="type-filter" className="text-sm font-medium text-gray-700">
            Property Type
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={e => handleTypeFilter(e.target.value as TypeFilter)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Location search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label htmlFor="location-query" className="text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            id="location-query"
            type="text"
            placeholder="Search by location…"
            value={locationQuery}
            onChange={e => handleLocationQuery(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Price range filter */}
        <div className="flex flex-col gap-1 min-w-[180px]">
          <label htmlFor="price-range" className="text-sm font-medium text-gray-700">
            Price Range
          </label>
          <select
            id="price-range"
            value={priceRange}
            onChange={e => handlePriceRange(e.target.value as PriceRange)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PRICE_RANGE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {filteredListings.length > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          Showing {paginatedListings.length} of {filteredListings.length} propert
          {filteredListings.length === 1 ? 'y' : 'ies'}
        </p>
      )}

      {/* Empty state */}
      {filteredListings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            className="w-16 h-16 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 22V12h6v10" />
          </svg>
          <p className="text-lg font-medium text-gray-700 mb-2">No properties match your search</p>
          <p className="text-sm text-gray-500 mb-6">Try adjusting your filters to find more results.</p>
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Listings grid */}
      {filteredListings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedListings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {showPagination && (
        <nav
          aria-label="Listings pagination"
          className="flex items-center justify-center gap-1 mt-8 flex-wrap"
        >
          {/* Previous */}
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>

          {/* Windowed page numbers with ellipsis */}
          {getPaginationItems().map((item, idx) =>
            item === 'ellipsis-start' || item === 'ellipsis-end' ? (
              <span
                key={item}
                className="px-2 py-2 text-sm text-gray-400 select-none"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={`page-${item}`}
                onClick={() => setCurrentPage(item)}
                aria-label={`Page ${item}`}
                aria-current={currentPage === item ? 'page' : undefined}
                className={`min-w-[36px] px-3 py-2 text-sm font-medium rounded border transition-colors ${
                  currentPage === item
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  )
}
