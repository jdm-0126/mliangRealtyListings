'use client'

import React, { useState, useCallback, useEffect, useDeferredValue, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { databases, DATABASE_ID } from '@/lib/appwrite/client'
import { Query } from 'appwrite'

const COL_LISTINGS = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_LISTINGS!
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PropertyCard from '@/components/PropertyCard'
import PropertyDialog from '@/components/PropertyDialog'
import QuickAddProperty from '@/components/QuickAddProperty'
import { Pagination } from '@/components/ui/Pagination'
import { Tooltip } from '@/components/ui/tooltip'
import { matchesLocationSearch } from '@/lib/appwrite/clientSearch'
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Settings2,
  MoreVertical,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import DuplicateDetector from '@/components/DuplicateDetector'

const PAGE_SIZE = 24

export default function PropertiesContent() {
  const searchParams = useSearchParams()

  // ── Data ──────────────────────────────────────────────────────────────────
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [columns, setColumns] = useState<string[]>([])

  // ── Filters ───────────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('')
  const deferredSearch = useDeferredValue(searchText)
  const [statusFilter, setStatusFilter] = useState('active')
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
    if (featured === 'true') { setFeaturedFilter(true); setStatusFilter('all') }
    if (location) setSearchText(location)
  }, [searchParams])

  useEffect(() => {
    try {
      const role = sessionStorage.getItem('viewAsRole') ?? ''
      setCanFeature(['superadmin', 'broker'].includes(role))
    } catch { /* ignore */ }
  }, [])

  // Close options menu on outside click
  useEffect(() => {
    if (!showOptionsMenu) return
    const handler = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node))
        setShowOptionsMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showOptionsMenu])

  // ── Fetch — server-side pagination + filter ───────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const queries: string[] = [
        Query.orderDesc('property_id'),
        Query.limit(PAGE_SIZE),
        Query.offset((currentPage - 1) * PAGE_SIZE),
      ]
      if (statusFilter !== 'all') queries.push(Query.equal('Status', statusFilter))
      if (featuredFilter) queries.push(Query.equal('featured', true))

      const res = await databases.listDocuments(DATABASE_ID, COL_LISTINGS, queries)
      const rows = (res.documents as unknown as Record<string, unknown>[])
        .filter(row => matchesLocationSearch(row, deferredSearch))
      setData(rows)
      setTotalCount(res.total)
      if (rows.length && !columns.length) setColumns(Object.keys(rows[0]))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [currentPage, statusFilter, featuredFilter, deferredSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData() }, [fetchData])

  // Reset to page 1 when filters change (but not on page change itself)
  const prevFilters = useRef({ statusFilter, featuredFilter, deferredSearch })
  useEffect(() => {
    const prev = prevFilters.current
    if (
      prev.statusFilter !== statusFilter ||
      prev.featuredFilter !== featuredFilter ||
      prev.deferredSearch !== deferredSearch
    ) {
      setCurrentPage(1)
      prevFilters.current = { statusFilter, featuredFilter, deferredSearch }
    }
  }, [statusFilter, featuredFilter, deferredSearch])

  // ── Client-side type sort (within the fetched page) ───────────────────────
  const displayData = React.useMemo(() => {
    let rows = [...data]
    if (typeFilter !== 'all') {
      rows = rows.filter(r => (r.Type as string || '').toLowerCase() === typeFilter.toLowerCase())
    }
    if (sortBy === 'price-high') rows.sort((a, b) => Number(b.Listing_Price || 0) - Number(a.Listing_Price || 0))
    else if (sortBy === 'price-low') rows.sort((a, b) => Number(a.Listing_Price || 0) - Number(b.Listing_Price || 0))
    else if (sortBy === 'oldest') rows.sort((a, b) => Number(a.property_id) - Number(b.property_id))
    return rows
  }, [data, typeFilter, sortBy])

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDelete = async (property: any) => {
    if (!confirm(`Delete Property #${property['property_id']}? This cannot be undone.`)) return
    try {
      await databases.deleteDocument(DATABASE_ID, COL_LISTINGS, property['$id'])
      fetchData()
    } catch (e: any) {
      alert('Error deleting: ' + e.message)
    }
  }

  async function handleEditToggle() {
    const turningOff = showEditControls
    setShowEditControls(v => !v)
    if (turningOff) {
      try {
        await fetch('/api/revalidate-home', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: 'mliang-revalidate-2024' }),
        })
      } catch { /* non-critical */ }
    }
  }

  // ── Skeleton cards for loading state ─────────────────────────────────────
  const SkeletonCard = () => (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
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
                {loading ? 'Loading…' : `Showing ${start}–${end} of ${totalCount} properties`}
              </p>
            </div>
            <div className="flex gap-2">
              <Tooltip content="Quick add property via paste">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowQuickAdd(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </Tooltip>
              <Tooltip content="Detect duplicate listings">
                <Button size="sm" variant="outline" className="border-amber-400 text-amber-600 hover:bg-amber-50" onClick={() => setShowDuplicates(true)}>
                  <AlertTriangle className="w-4 h-4 mr-1" /> Duplicates
                </Button>
              </Tooltip>
              <Tooltip content={showFilters ? 'Hide filters' : 'Show filters'}>
                <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters(v => !v)}>
                  <Filter className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Enable edit/delete buttons">
                <Button variant={showEditControls ? 'default' : 'outline'} size="sm" onClick={handleEditToggle}>
                  <Settings2 className="w-4 h-4 mr-1" />
                  {showEditControls ? 'Editing On' : 'Edit'}
                </Button>
              </Tooltip>
              <div className="relative" ref={optionsMenuRef}>
                <Tooltip content="More options">
                  <Button variant="outline" size="sm" onClick={() => setShowOptionsMenu(v => !v)}>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </Tooltip>
                {showOptionsMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    {(['grid', 'list'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => { setViewMode(mode); setShowOptionsMenu(false) }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${viewMode === mode ? 'text-blue-700 bg-blue-50' : 'text-black'}`}
                      >
                        {mode === 'grid' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
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
                  placeholder="Search by location…"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Status</label>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-black">
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Type</label>
                  <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-black">
                    <option value="all">All Types</option>
                    <option value="residential">House & Lot</option>
                    <option value="lot">Lot Only</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Sort</label>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-black">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-high">Price: High → Low</option>
                    <option value="price-low">Price: Low → High</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => { setStatusFilter('active'); setTypeFilter('all'); setFeaturedFilter(false); setSortBy('newest'); setSearchText('') }}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{loading ? '…' : `${totalCount} total`}</span>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={featuredFilter} onChange={e => setFeaturedFilter(e.target.checked)} />
                Featured only
              </label>
            </div>
          </CardContent>
        </Card>

        {/* ── Top pagination ────────────────────────────────────────────── */}
        {totalCount > PAGE_SIZE && (
          <Pagination currentPage={currentPage} totalItems={totalCount} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
        )}

        {/* ── Property grid / list ──────────────────────────────────────── */}
        <div className={`mt-6 mb-6 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}`}>
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
            : displayData.length === 0
              ? (
                <div className="col-span-full py-20 text-center text-gray-400">
                  No properties found.
                </div>
              )
              : displayData.map((property, index) => (
                <PropertyCard
                  key={`${property.property_id}-${index}`}
                  property={property}
                  viewMode={viewMode}
                  onEdit={showEditControls ? setEditingProperty : undefined}
                  onDelete={showEditControls ? handleDelete : undefined}
                  onFeaturedChange={fetchData}
                  canFeature={canFeature}
                />
              ))
          }
        </div>

        {/* ── Bottom pagination ─────────────────────────────────────────── */}
        {totalCount > PAGE_SIZE && (
          <Pagination currentPage={currentPage} totalItems={totalCount} pageSize={PAGE_SIZE} onPageChange={p => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
        )}

        {/* ── Dialogs ───────────────────────────────────────────────────── */}
        <PropertyDialog
          property={editingProperty}
          isOpen={!!editingProperty}
          onClose={() => { setEditingProperty(null); fetchData() }}
          columns={columns}
        />

        {showQuickAdd && (
          <QuickAddProperty
            onClose={() => setShowQuickAdd(false)}
            onSuccess={() => { setShowQuickAdd(false); fetchData() }}
          />
        )}

        {showDuplicates && (
          <DuplicateDetector
            onClose={() => setShowDuplicates(false)}
            onEdit={(p) => { setShowEditControls(true); setEditingProperty(p) }}
            onDelete={() => fetchData()}
          />
        )}
      </div>
    </div>
  )
}
