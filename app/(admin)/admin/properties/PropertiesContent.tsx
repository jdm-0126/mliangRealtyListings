'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PropertyCard from '@/components/PropertyCard'
import PropertyDialog from '@/components/PropertyDialog'
import QuickAddProperty from '@/components/QuickAddProperty'
import { Pagination } from '@/components/ui/Pagination'
import { Tooltip } from '@/components/ui/tooltip'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  Home,
  Settings2,
  MoreVertical,
  Plus,
} from 'lucide-react'

export default function PropertiesContent() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [featuredFilter, setFeaturedFilter] = useState<boolean>(false)
  const [locationFilter, setLocationFilter] = useState<string>('')
  const [priceFilter, setPriceFilter] = useState<string>('')
  const [sizeFilter, setSizeFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [showEditControls, setShowEditControls] = useState(false)
  const [canFeature, setCanFeature] = useState(false)

  // Check role once on mount
  useEffect(() => {
    try {
      const role = sessionStorage.getItem('viewAsRole') ?? ''
      setCanFeature(['superadmin', 'broker'].includes(role))
    } catch { /* ignore */ }
  }, [])

  async function handleEditToggle() {
    const turningOff = showEditControls
    setShowEditControls(v => !v)

    // When turning edit mode OFF, revalidate the public homepage
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
  const [editingProperty, setEditingProperty] = useState<any>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [pageSize, setPageSize] = useState(24)
  const [currentPage, setCurrentPage] = useState(1)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const optionsMenuRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const type = searchParams.get('type')
    const location = searchParams.get('location')
    const price = searchParams.get('price')
    const size = searchParams.get('size')
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')

    if (type) {
      if (type.toLowerCase().includes('house')) setTypeFilter('residential')
      else if (type.toLowerCase().includes('lot')) setTypeFilter('lot')
      else if (type.toLowerCase().includes('commercial')) setTypeFilter('commercial')
    }

    if (status) {
      setStatusFilter(status.toLowerCase())
    }

    if (featured === 'true') {
      setFeaturedFilter(true)
      setStatusFilter('all') // show all statuses when viewing featured
    }

    if (location) {
      setLocationFilter(location)
      setSearchText(location)
    }

    if (price) {
      setPriceFilter(price)
    }

    if (size) {
      setSizeFilter(size)
    }
  }, [searchParams])

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false)
      }
    }

    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showOptionsMenu])

  const fetchData = useCallback(async () => {
    if (!supabase) {
      console.error('Supabase client not initialized')
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('mlianglistings')
      .select('*')
      .order('Property ID', { ascending: false })
      .limit(500)
    if (error) {
      setLoading(false)
      return
    }
    setData(data || [])
    if (data && data.length > 0) {
      setColumns(Object.keys(data[0]))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    let filtered = data

    if (searchText) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchText.toLowerCase())
        )
      )
    }

    if (locationFilter) {
      filtered = filtered.filter(row =>
        (row.Location || row.Address || '').toLowerCase().includes(locationFilter.toLowerCase())
      )
    }

    if (priceFilter) {
      const priceInput = priceFilter.toLowerCase()
      filtered = filtered.filter(row => {
        const price = parseFloat(String(row['Listing Price'] || row.ListingPrice || row.Price || '0').replace(/[^\d.]/g, '')) || 0
        
        if (priceInput.includes('under') || priceInput.includes('below')) {
          const match = priceInput.match(/(\d+)m?/)
          if (match) return price <= parseInt(match[1]) * 1000000
        } else if (priceInput.includes('above') || priceInput.includes('over')) {
          const match = priceInput.match(/(\d+)m?/)
          if (match) return price >= parseInt(match[1]) * 1000000
        } else if (priceInput.includes('to')) {
          const matches = priceInput.match(/(\d+)m?\s*to\s*(\d+)m?/)
          if (matches) {
            const minPrice = parseInt(matches[1]) * 1000000
            const maxPrice = parseInt(matches[2]) * 1000000
            return price >= minPrice && price <= maxPrice
          }
        }
        return true
      })
    }

    if (sizeFilter && sizeFilter !== 'No preference') {
      filtered = filtered.filter(row => {
        const lotSize = parseFloat(String(row['Lot Area'] || row.LotArea || '0').replace(/[^\d.]/g, '')) || 0
        const floorSize = parseFloat(String(row['Floor Area'] || row.FloorArea || '0').replace(/[^\d.]/g, '')) || 0
        const totalSize = Math.max(lotSize, floorSize)
        
        if (sizeFilter.includes('to') || sizeFilter.includes('-')) {
          const matches = sizeFilter.match(/(\d+)[\s-]*(?:to|-)\s*(\d+)/)
          if (matches) {
            const minSize = parseInt(matches[1])
            const maxSize = parseInt(matches[2])
            return totalSize >= minSize && totalSize <= maxSize
          }
        } else if (sizeFilter.includes('least') || sizeFilter.includes('minimum')) {
          const match = sizeFilter.match(/(\d+)/)
          if (match) return totalSize >= parseInt(match[1])
        } else if (sizeFilter.includes('around') || sizeFilter.includes('about')) {
          const match = sizeFilter.match(/(\d+)/)
          if (match) {
            const target = parseInt(match[1])
            return totalSize >= target * 0.8 && totalSize <= target * 1.2
          }
        }
        return true
      })
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(row => 
        (row.Status || '').toLowerCase() === statusFilter.toLowerCase()
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(row => 
        (row.Type || '').toLowerCase() === typeFilter.toLowerCase()
      )
    }

    if (featuredFilter) {
      filtered = filtered.filter(row => row.featured === true)
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return Number(b['Property ID']) - Number(a['Property ID'])
        case 'oldest':
          return Number(a['Property ID']) - Number(b['Property ID'])
        case 'price-high':
          const priceA = parseFloat(String(a['Listing Price'] || a.ListingPrice || a.Price || '0').replace(/[^\d.]/g, '')) || 0
          const priceB = parseFloat(String(b['Listing Price'] || b.ListingPrice || b.Price || '0').replace(/[^\d.]/g, '')) || 0
          return priceB - priceA
        case 'price-low':
          const priceA2 = parseFloat(String(a['Listing Price'] || a.ListingPrice || a.Price || '0').replace(/[^\d.]/g, '')) || 0
          const priceB2 = parseFloat(String(b['Listing Price'] || b.ListingPrice || b.Price || '0').replace(/[^\d.]/g, '')) || 0
          return priceA2 - priceB2
        default:
          return 0
      }
    })
    
    setFilteredData(filtered)
    setCurrentPage(1)
  }, [data, searchText, statusFilter, typeFilter, featuredFilter, locationFilter, priceFilter, sizeFilter, sortBy])

  const handleDelete = async (property: any) => {
    const id = property['Property ID']
    if (!confirm(`Delete Property #${id > 2 ? id - 1 : id}? This cannot be undone.`)) return
    if (!supabase) return
    const { error } = await supabase
      .from('mlianglistings')
      .delete()
      .eq('Property ID', id)
    if (error) {
      alert('Error deleting property: ' + error.message)
    } else {
      fetchData()
    }
  }

  const buildPostText = (property: any) => {
    const hasPhotos = Object.keys(property).some(key => key.toLowerCase().includes('photo') && property[key])
    const hasVideo = Object.keys(property).some(key => key.toLowerCase().includes('video') && property[key])
    let mediaInfo = ''
    if (hasPhotos && hasVideo) mediaInfo = '\n\nPM for Photos and Video'
    else if (hasPhotos) mediaInfo = '\n\nPM for Photos'
    else if (hasVideo) mediaInfo = '\n\nPM for Video'
    const lotArea = property['Lot Area'] || property.LotArea || ''
    const floorArea = property['Floor Area'] || property.FloorArea || ''
    const notes = (property.Notes || '').replace(/[^\w\s.,;:()\-₱\n]/g, '')
    let areaInfo = ''
    if (lotArea) areaInfo += `\nLot Area : ${lotArea}`
    if (floorArea) areaInfo += `\nFloor Area : ${floorArea}`
    const s = JSON.parse(localStorage.getItem('tenantSettings') || '{}')
    const biz = s.businessName || 'M. Liang Realty'
    const broker = s.brokerName || ''
    const title = s.brokerTitle || 'Licensed Real Estate Broker'
    const prc = s.prcNumber || '0019653'
    const addr = s.officeAddress || ''
    const phone = s.contactNumber || '09393440944'
    return `HOUSE AND LOT FOR SALE\n\n${property.Village ? property.Village + ',\n' : ''}${property.Location || ''},\n\n${property['Listing Price'] || ''}${areaInfo}\n\n${notes}\n\n${biz}\n${broker}\n${title}\nPRC No. ${prc}\n${addr}\n${phone}${mediaInfo}`
  }

  const handleInstagramPost = (property: any) => {
    navigator.clipboard.writeText(buildPostText(property))
    alert('Caption copied! Open the Instagram app and paste it into your post/reel caption.')
  }

  const handleTikTokPost = (property: any) => {
    navigator.clipboard.writeText(buildPostText(property))
    alert('Caption copied! Open the TikTok app and paste it into your video caption.')
  }

  const handleFacebookLinkSave = async (property: any, fbLink: string) => {
    if (!supabase) return
    const { error } = await supabase
      .from('mlianglistings')
      .update({ 'FB Link': fbLink })
      .eq('Property ID', property['Property ID'])
    if (error) {
      alert('Error saving FB link: ' + error.message)
    } else {
      fetchData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              <h2 className="text-3xl font-bold" style={{ color: '#000000' }}>Properties</h2>
              <p style={{ color: '#4b5563' }}>Browse all available properties</p>
            </div>
            <div className="flex gap-2">
              <Tooltip content="Quick add property via paste">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowQuickAdd(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </Tooltip>

              <Tooltip content={showFilters ? "Hide search filters" : "Show search filters"}>
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
                  onClick={handleEditToggle}
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
                      onClick={() => {
                        setViewMode('grid')
                        setShowOptionsMenu(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                        viewMode === 'grid' ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                      style={{ color: viewMode === 'grid' ? '#1d4ed8' : '#000000' }}
                    >
                      <Grid3X3 className="w-4 h-4" />
                      Grid View
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('list')
                        setShowOptionsMenu(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                        viewMode === 'list' ? 'bg-blue-50 text-blue-700' : ''
                      }`}
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
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2" style={{ color: '#1e3a8a' }}>Search Filters Applied:</h3>
              <div className="flex flex-wrap gap-2">
                {locationFilter && (
                  <Badge variant="secondary" className="bg-blue-100" style={{ color: '#1e3a8a' }}>
                    Location: {locationFilter}
                  </Badge>
                )}
                {priceFilter && (
                  <Badge variant="secondary" className="bg-blue-100" style={{ color: '#1e3a8a' }}>
                    Budget: {priceFilter}
                  </Badge>
                )}
                {sizeFilter && sizeFilter !== 'No preference' && (
                  <Badge variant="secondary" className="bg-blue-100" style={{ color: '#1e3a8a' }}>
                    Size: {sizeFilter}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search properties..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                      style={{ color: '#000000' }}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
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
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Price Range</label>
                    <Input
                      placeholder="e.g. 2M to 5M, Under 3M"
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                      style={{ color: '#000000' }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="price-low">Price: Low to High</option>
                    </select>
                  </div>

                  {/* View toggle — sits on its own row on small screens, last column on xl */}
                  <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3 xl:col-span-5">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => {
                          setStatusFilter('active')
                          setTypeFilter('all')
                          setFeaturedFilter(false)
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
                </div>
              )}
              
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm" style={{ color: '#4b5563' }}>
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}–{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} properties
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
                    <option value={96}>96</option>
                    <option value={99999}>All</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredData.length === 0 ? (
            <Card className="p-8 text-center">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2" style={{ color: '#000000' }}>No properties found</h3>
              <p style={{ color: '#4b5563' }}>Try adjusting your search or filters</p>
            </Card>
        ) : (
          <>
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {filteredData
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((property) => (
                  <PropertyCard
                    key={property['Property ID']}
                    property={property}
                    viewMode={viewMode}
                    onEdit={showEditControls ? (p) => setEditingProperty(p) : undefined}
                    onDelete={showEditControls ? handleDelete : undefined}
                    onFacebookLinkSave={showEditControls ? handleFacebookLinkSave : undefined}
                    onInstagramPost={handleInstagramPost}
                    onTikTokPost={handleTikTokPost}
                    canFeature={showEditControls ? canFeature : false}
                  />
                ))}
            </div>

            {/* Pagination controls */}
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

        {/* Edit dialog */}
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
