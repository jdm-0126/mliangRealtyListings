
'use client'
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import PropertyCard from '@/components/PropertyCard'
import PropertyDialog from '@/lib/shared/components/property/PropertyDialog'
import QuickAddProperty from '@/components/QuickAddProperty'
import { Pagination } from '@/components/ui/Pagination'
import { Tooltip } from '@/components/ui/tooltip'
import { supabase } from '@/lib/supabase/browserTenantClient'
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Settings2,
  MoreVertical,
  Plus,
  AlertTriangle,
  MapPin,
  X,
} from 'lucide-react'
import DuplicateDetector from '@/components/DuplicateDetector'
const PAGE_SIZE = 24
// Custom Debounce Hook: Waits `delay` ms after typing stops before returning updated value
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  return debouncedValue
}
// Popular location shortcuts for fast predicted search
const POPULAR_LOCATIONS = ['Quezon City', 'Makati', 'Taguig', 'Cebu', 'Pampanga', 'Davao']
export default function PropertiesContent() {
  const searchParams = useSearchParams()
  // ── Data ──────────────────────────────────────────────────────────────────
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [columns, setColumns] = useState<string[]>([])
  // ── Filters ───────────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('')
  // Debounce search text by 500ms to prevent query spam
  const debouncedSearch = useDebounce(searchText, 500)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [featuredFilter, setFeaturedFilter] = useState(false)
  // ── UI state ──────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showEditControls, setShowEditControls] = useState(false)
  const [canFeature, setCanFeature] = useState(false)
  const [editingProperty, setEditingProperty] = useState<any>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [showDuplicates, setShowDuplicates] = useState(false)
  const optionsMenuRef = useRef<HTMLDivElement>(null)
  // ── Init from URL params ──────────────────────────────────────────────────
  useEffect(() => {
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')
    const location = searchParams.get('location')
    if (type) {
      if (type.toLowerCase().includes('house')) setTypeFilter('residential')
      else if (type.toLowerCase().includes('lot')) setTypeFilter('lot')
      else if (type.toLowerCase().includes('commercial')) setTypeFilter('commercial')
    }
    if (status) setStatusFilter(status.toLowerCase())
    if (featured === 'true') {
      setFeaturedFilter(true)
      setStatusFilter('all')
    }
    if (location) setSearchText(location)
  }, [searchParams])
  useEffect(() => {
    try {
      const role = sessionStorage.getItem('viewAsRole') ?? ''
      setCanFeature(['superadmin', 'broker'].includes(role))
    } catch {
      /* ignore */
    }
  }, [])
  // Close options menu on outside click
  useEffect(() => {
    if (!showOptionsMenu) return
    const handler = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showOptionsMenu])
  // ── Fetch — server-side pagination + filter ───────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('listings')
        .select('*', { count: 'exact' })
      // Handle Sorting
      if (sortBy === 'price-high') {
        query = query.order('listing_price', { ascending: false, nullsFirst: false })
      } else if (sortBy === 'price-low') {
        query = query.order('listing_price', { ascending: true, nullsFirst: false })
      } else if (sortBy === 'oldest') {
        query = query.order('property_id', { ascending: true })
      } else {
        query = query.order('property_id', { ascending: false })
      }
      // Handle Status Filter
      if (statusFilter !== 'all') {
        query = query.ilike('status', statusFilter)
      }
      // Handle Featured Filter
      if (featuredFilter) {
        query = query.eq('featured', true)
      }
      // Safe Debounced Search Filter (PostgREST parser friendly)
      const search = debouncedSearch.trim()
      if (search) {
        const num = Number(search)
        const isNum = !isNaN(num) && search.length > 0
        if (isNum) {
          // If searching a number, query exact match on numeric IDs/areas or string match on location
          query = query.or(
            `property_id.eq.${num},lot_area_sqm.eq.${num},listing_price.eq.${num},location.ilike.%${search}%`
          )
        } else {
          // Standard case-insensitive string search across location and text fields
          query = query.ilike('location', `%${search}%`)
        }
      }
      const { data, error, count } = await query.range(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE - 1
      )
      if (error) throw error
      const rows = data ?? []
      setData(rows)
      setTotalCount(count ?? 0)
      if (rows.length && !columns.length) {
        setColumns(Object.keys(rows[0]))
      }
    } catch (e: any) {
      console.error('Error fetching listings:', e?.message || e)
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, featuredFilter, debouncedSearch, sortBy, columns.length])
  useEffect(() => {
    fetchData()
  }, [fetchData])
  // Reset to page 1 when filters change
  const prevFilters = useRef({ statusFilter, featuredFilter, debouncedSearch, sortBy })
  useEffect(() => {
    const prev = prevFilters.current
    if (
      prev.statusFilter !== statusFilter ||
      prev.featuredFilter !== featuredFilter ||
      prev.debouncedSearch !== debouncedSearch ||
      prev.sortBy !== sortBy
    ) {
      setCurrentPage(1)
      prevFilters.current = { statusFilter, featuredFilter, debouncedSearch, sortBy }
    }
  }, [statusFilter, featuredFilter, debouncedSearch, sortBy])
  // ── Client-side type filter ───────────────────────────────────────
  const displayData = React.useMemo(() => {
    let rows = [...data]
    if (typeFilter !== 'all') {
      rows = rows.filter(
        (r) => (r.type as string || r.Type as string || '').toLowerCase() === typeFilter.toLowerCase()
      )
    }
    return rows
  }, [data, typeFilter])
  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDelete = async (property: any) => {
    if (!confirm(`Delete Property #${property.property_id}? This cannot be undone.`)) {
      return
    }
    try {
      const { error } = await supabase.from('listings').delete().eq('id', property.id)
      if (error) throw error
      fetchData()
    } catch (e: any) {
      alert('Error deleting property: ' + (e.message ?? String(e)))
    }
  }
  async function handleEditToggle() {
    const turningOff = showEditControls
    setShowEditControls((v) => !v)
    if (turningOff) {
      try {
        await fetch('/api/revalidate-home', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: 'mliang-revalidate-2024' }),
        })
      } catch {
        /* non-critical */
      }
    }
  }
  // ── Skeleton cards for loading state ─────────────────────────────────────
  const SkeletonCard = () => (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: '#fff', border: '1px solid #e5e7eb' }}
    >
      <div className="h-52 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-8 bg-gray-200 rounded mt-4" />
      </div>
    </div>
  )
  const start = (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, totalCount)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Sticky header ─────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-gray-50 pb-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-3xl font-bold text-black">Properties</h2>
              <p className="text-gray-500 text-sm">
                {loading ? 'Searching...' : `Showing ${start}–${end} of ${totalCount} properties`}
              </p>
            </div>
            <div className="flex gap-2">
              <Tooltip content="Quick add property via paste">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowQuickAdd(true)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </Tooltip>
              <Tooltip content="Detect duplicate listings">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-400 text-amber-600 hover:bg-amber-50"
                  onClick={() => setShowDuplicates(true)}
                >
                  <AlertTriangle className="w-4 h-4 mr-1" /> Duplicates
                </Button>
              </Tooltip>
              <Tooltip content={showFilters ? 'Hide filters' : 'Show filters'}>
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilters((v) => !v)}
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Enable edit/delete buttons">
                <Button
                  variant={showEditControls ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleEditToggle}
                >
                  <Settings2 className="w-4 h-4 mr-1" />
                  {showEditControls ? 'Editing On' : 'Edit'}
                </Button>
              </Tooltip>
              <div className="relative" ref={optionsMenuRef}>
                <Tooltip content="More options">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOptionsMenu((v) => !v)}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </Tooltip>
                {showOptionsMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    {(['grid', 'list'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setViewMode(mode)
                          setShowOptionsMenu(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                          viewMode === mode ? 'text-blue-700 bg-blue-50' : 'text-black'
                        }`}
                      >
                        {mode === 'grid' ? (
                          <Grid3X3 className="w-4 h-4" />
                        ) : (
                          <List className="w-4 h-4" />
                        )}
                        {mode === 'grid' ? 'Grid View' : 'List View'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* ── Filter card ───────────────────────────────────────────────── */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search location, property ID, price, or lot area..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {/* Popular/Suggested Locations Row */}
            <div className="flex items-center gap-2 flex-wrap mb-3 text-xs text-gray-500">
              <span className="flex items-center gap-1 font-medium text-gray-700">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Popular Locations:
              </span>
              {POPULAR_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => setSearchText(loc)}
                  className={`px-2.5 py-1 rounded-full border transition-all ${
                    searchText.toLowerCase() === loc.toLowerCase()
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
            {showFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-black"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-black"
                  >
                    <option value="all">All Types</option>
                    <option value="residential">House & Lot</option>
                    <option value="lot">Lot Only</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                    Sort
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-black"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-high">Price: High → Low</option>
                    <option value="price-low">Price: Low → High</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter('all')
                      setTypeFilter('all')
                      setFeaturedFilter(false)
                      setSortBy('newest')
                      setSearchText('')
                    }}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{loading ? 'Searching database...' : `${totalCount} total matching`}</span>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.checked)}
                />
                Featured only
              </label>
            </div>
          </CardContent>
        </Card>
        {/* ── Top pagination ────────────────────────────────────────────── */}
        {totalCount > PAGE_SIZE && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        )}
        {/* ── Property grid / list ──────────────────────────────────────── */}
        <div
          className={`mt-6 mb-6 ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'flex flex-col gap-4'
          }`}
        >
          {loading ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
          ) : displayData.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-400">
              No properties found matching your search.
            </div>
          ) : (
            displayData.map((property, index) => (
              <PropertyCard
                key={`${property.id}-${index}`}
                property={property}
                viewMode={viewMode}
                onEdit={showEditControls ? setEditingProperty : undefined}
                onDelete={showEditControls ? handleDelete : undefined}
                onFeaturedChange={fetchData}
                canFeature={canFeature}
              />
            ))
          )}
        </div>
        {/* ── Bottom pagination ─────────────────────────────────────────── */}
        {totalCount > PAGE_SIZE && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={(p) => {
              setCurrentPage(p)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        )}
        {/* ── Dialogs ───────────────────────────────────────────────────── */}
        <PropertyDialog
          property={editingProperty}
          open={!!editingProperty}
          onClose={() => {
            setEditingProperty(null)
            fetchData()
          }}
          columns={columns}
          onSave={async (p) => {
            const { error } = await supabase.from('listings').update(p).eq('id', p.id)
            if (error) throw error
            fetchData()
          }}
        />
        {showQuickAdd && (
          <QuickAddProperty
            onClose={() => setShowQuickAdd(false)}
            onSuccess={() => {
              setShowQuickAdd(false)
              fetchData()
            }}
          />
        )}
        {showDuplicates && (
          <DuplicateDetector
            onClose={() => setShowDuplicates(false)}
            onEdit={(p) => {
              setShowEditControls(true)
              setEditingProperty(p)
            }}
            onDelete={() => fetchData()}
          />
        )}
      </div>
    </div>
  )
}
