'use client'

import React, { useState, useCallback, useEffect, useDeferredValue } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import PropertyCard from '@/components/PropertyCard'
import PropertyDialog from '@/components/PropertyDialog'
import QuickAddProperty from '@/components/QuickAddProperty'
import { Pagination } from '@/components/ui/Pagination'
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Home,
  Settings2,
  Plus,
  MoreVertical,
} from 'lucide-react'

export default function RentalsContent() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const deferredSearch = useDeferredValue(searchText)
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('')
  const [priceFilter, setPriceFilter] = useState<string>('')
  const [sizeFilter, setSizeFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [showEditControls, setShowEditControls] = useState(false)
  const [editingProperty, setEditingProperty] = useState<any>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [columns, setColumns] = useState<string[]>([])
  const [pageSize, setPageSize] = useState(24)
  const [currentPage, setCurrentPage] = useState(1)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const optionsMenuRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const location = searchParams.get('location')
    const price = searchParams.get('price')
    const size = searchParams.get('size')
    if (location) { setLocationFilter(location); setSearchText(location) }
    if (price) setPriceFilter(price)
    if (size) setSizeFilter(size)
  }, [searchParams])

  useEffect(() => {
    if (!showOptionsMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node))
        setShowOptionsMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showOptionsMenu])

  const fetchData = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('mlianglistings')
      .select('*')
      .order('Property ID', { ascending: false })
      .limit(500)

    if (error) { setLoading(false); return }

    const rentals = (rows || []).filter((row: any) =>
      row['Listing Mode'] === 'For Rent' ||
      String(row.Notes || '').startsWith('[FOR RENT]')
    )

    setData(rentals)
    if (rentals.length > 0) setColumns(Object.keys(rentals[0]))
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    let filtered = data

    if (deferredSearch) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(deferredSearch.toLowerCase())
        )
      )
    }

    if (locationFilter) {
      filtered = filtered.filter(row =>
        (row.Location || row.Address || '').toLowerCase().includes(locationFilter.toLowerCase())
      )
    }

    if (priceFilter) {
      const pi = priceFilter.toLowerCase()
      filtered = filtered.filter(row => {
        const price = parseFloat(String(row['Listing Price'] || row.ListingPrice || row.Price || '0').replace(/[^\d.]/g, '')) || 0
        if (pi.includes('under') || pi.includes('below')) {
          const m = pi.match(/(\d+)m?/); if (m) return price <= parseInt(m[1]) * 1000000
        } else if (pi.includes('above') || pi.includes('over')) {
          const m = pi.match(/(\d+)m?/); if (m) return price >= parseInt(m[1]) * 1000000
        } else if (pi.includes('to')) {
          const m = pi.match(/(\d+)m?\s*to\s*(\d+)m?/)
          if (m) return price >= parseInt(m[1]) * 1000000 && price <= parseInt(m[2]) * 1000000
        }
        return true
      })
    }

    if (sizeFilter && sizeFilter !== 'No preference') {
      filtered = filtered.filter(row => {
        const lot = parseFloat(String(row['Lot Area'] || row.LotArea || '0').replace(/[^\d.]/g, '')) || 0
        const floor = parseFloat(String(row['Floor Area'] || row.FloorArea || '0').replace(/[^\d.]/g, '')) || 0
        const size = Math.max(lot, floor)
        if (sizeFilter.includes('to') || sizeFilter.includes('-')) {
          const m = sizeFilter.match(/(\d+)[\s-]*(?:to|-)\s*(\d+)/)
          if (m) return size >= parseInt(m[1]) && size <= parseInt(m[2])
        } else if (sizeFilter.includes('least') || sizeFilter.includes('minimum')) {
          const m = sizeFilter.match(/(\d+)/); if (m) return size >= parseInt(m[1])
        }
        return true
      })
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(row =>
        (row.Type || '').toLowerCase() === typeFilter.toLowerCase()
      )
    }

    filtered.sort((a, b) => {
      if (sortBy === 'newest') return Number(b['Property ID']) - Number(a['Property ID'])
      if (sortBy === 'oldest') return Number(a['Property ID']) - Number(b['Property ID'])
      const pa = parseFloat(String(a['Listing Price'] || '0').replace(/[^\d.]/g, '')) || 0
      const pb = parseFloat(String(b['Listing Price'] || '0').replace(/[^\d.]/g, '')) || 0
      if (sortBy === 'price-high') return pb - pa
      if (sortBy === 'price-low') return pa - pb
      return 0
    })

    setFilteredData(filtered)
    setCurrentPage(1)
  }, [data, deferredSearch, typeFilter, locationFilter, priceFilter, sizeFilter, sortBy])

  const handleDelete = async (property: any) => {
    const id = property['Property ID']
    if (!confirm(`Delete Property #${id > 2 ? id - 1 : id}? This cannot be undone.`)) return
    if (!supabase) return
    const { error } = await supabase
      .from('mlianglistings')
      .delete()
      .eq('Property ID', id)
    if (error) alert('Error deleting property: ' + error.message)
    else fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-gray-50 pb-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-3xl font-bold" style={{ color: '#000000' }}>Rental Properties</h2>
              <p style={{ color: '#4b5563' }}>Browse all available properties for rent</p>
            </div>
            <div className="flex gap-2">
              <Tooltip content="Add rental property via paste">
                <Button
                  onClick={() => setShowQuickAdd(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </Tooltip>

              <Tooltip content={showFilters ? 'Hide search filters' : 'Show search filters'}>
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </Tooltip>

              <Tooltip content="Enable edit/delete buttons">
                <Button
                  variant={showEditControls ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowEditControls(v => !v)}
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  {showEditControls ? 'Editing On' : 'Edit'}
                </Button>
              </Tooltip>

              {/* Options Dropdown */}
              <div className="relative" ref={optionsMenuRef}>
                <Tooltip content="More options">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </Tooltip>

                {showOptionsMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => { setViewMode('grid'); setShowOptionsMenu(false) }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${viewMode === 'grid' ? 'bg-blue-50' : ''}`}
                      style={{ color: viewMode === 'grid' ? '#1d4ed8' : '#000000' }}
                    >
                      <Grid3X3 className="w-4 h-4" />
                      Grid View
                    </button>
                    <button
                      onClick={() => { setViewMode('list'); setShowOptionsMenu(false) }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${viewMode === 'list' ? 'bg-blue-50' : ''}`}
                      style={{ color: viewMode === 'list' ? '#1d4ed8' : '#000000' }}
                    >
                      <List className="w-4 h-4" />
                      List View
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(locationFilter || priceFilter || sizeFilter) && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium mb-2" style={{ color: '#14532d' }}>Search Filters Applied:</h3>
              <div className="flex flex-wrap gap-2">
                {locationFilter && (
                  <Badge variant="secondary" className="bg-green-100" style={{ color: '#14532d' }}>
                    Location: {locationFilter}
                  </Badge>
                )}
                {priceFilter && (
                  <Badge variant="secondary" className="bg-green-100" style={{ color: '#14532d' }}>
                    Rent: {priceFilter}
                  </Badge>
                )}
                {sizeFilter && sizeFilter !== 'No preference' && (
                  <Badge variant="secondary" className="bg-green-100" style={{ color: '#14532d' }}>
                    Size: {sizeFilter}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search + filter bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search rentals..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                    <select
                      value={typeFilter}
                      onChange={e => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                      style={{ color: '#000000' }}
                    >
                      <option value="all">All Types</option>
                      <option value="residential">House & Lot</option>
                      <option value="lot">Lot Only</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</label>
                    <Input
                      placeholder="e.g. San Fernando, Clark"
                      value={locationFilter}
                      onChange={e => setLocationFilter(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Rent</label>
                    <Input
                      placeholder="e.g. 10K to 30K, Under 20K"
                      value={priceFilter}
                      onChange={e => setPriceFilter(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                      style={{ color: '#000000' }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="price-high">Rent: High to Low</option>
                      <option value="price-low">Rent: Low to High</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-end">
                    <button
                      onClick={() => {
                        setTypeFilter('all')
                        setLocationFilter('')
                        setPriceFilter('')
                        setSizeFilter('')
                        setSortBy('newest')
                        setSearchText('')
                      }}
                      className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm" style={{ color: '#4b5563' }}>
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}–{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} rental{filteredData.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Per page:</label>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                    className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                    style={{ color: '#000000' }}
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                    <option value={99999}>All</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredData.length === 0 ? (
          <Card className="p-8 text-center">
            <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2" style={{ color: '#000000' }}>No rental properties found</h3>
            <p style={{ color: '#4b5563' }}>Try adjusting your search or filters, or add a new rental listing.</p>
          </Card>
        ) : (
          <>
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredData
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map(property => (
                  <PropertyCard
                    key={property['Property ID']}
                    property={property}
                    viewMode={viewMode}
                    onEdit={showEditControls ? p => setEditingProperty(p) : undefined}
                    onDelete={showEditControls ? handleDelete : undefined}
                  />
                ))}
            </div>

            {filteredData.length > pageSize && (
              <Pagination
                currentPage={currentPage}
                totalItems={filteredData.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}

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
      </div>
    </div>
  )
}
