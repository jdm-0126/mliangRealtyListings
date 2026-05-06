'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PropertyCard from '@/components/PropertyCard'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  MapPin,
  Home,
  DollarSign,
  Calendar
} from 'lucide-react'

export default function PropertiesPage() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('')
  const [priceFilter, setPriceFilter] = useState<string>('')
  const [sizeFilter, setSizeFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  // Initialize filters from URL parameters
  useEffect(() => {
    const type = searchParams.get('type')
    const location = searchParams.get('location')
    const price = searchParams.get('price')
    const size = searchParams.get('size')
    
    if (type) {
      if (type.toLowerCase().includes('house')) setTypeFilter('residential')
      else if (type.toLowerCase().includes('lot')) setTypeFilter('lot')
      else if (type.toLowerCase().includes('commercial')) setTypeFilter('commercial')
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
    if (error) {
      setLoading(false)
      return
    }
    setData(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    let filtered = data

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchText.toLowerCase())
        )
      )
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter(row =>
        (row.Location || row.Address || '').toLowerCase().includes(locationFilter.toLowerCase())
      )
    }

    // Apply price filter
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

    // Apply size filter
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

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(row => 
        (row.Status || '').toLowerCase() === statusFilter.toLowerCase()
      )
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(row => 
        (row.Type || '').toLowerCase() === typeFilter.toLowerCase()
      )
    }
    
    // Sort the filtered data
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
  }, [data, searchText, statusFilter, typeFilter, locationFilter, priceFilter, sizeFilter, sortBy])

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>Properties</h1>
          <p style={{ color: '#4b5563' }}>Browse all available properties</p>
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

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              {/* Search and Toggle */}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showFilters ? 'Hide' : 'Filters'}
                </Button>
              </div>

              {/* Filters - Collapsible */}
              {showFilters && (
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      style={{ color: '#000000' }}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="sold">Sold</option>
                    </select>
                    
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      style={{ color: '#000000' }}
                    >
                      <option value="all">All Types</option>
                      <option value="residential">House & Lot</option>
                      <option value="lot">Lot Only</option>
                      <option value="commercial">Commercial</option>
                    </select>
                    
                    <Input
                      placeholder="Location (e.g., San Fernando, Mexico, Bacolor)"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-64"
                    />
                    
                    <Input
                      placeholder="Price range (e.g., 2M to 5M, Under 3M)"
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-64"
                    />
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      style={{ color: '#000000' }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="price-low">Price: Low to High</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="text-sm" style={{ color: '#4b5563' }}>
                Showing {filteredData.length} of {data.length} properties
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid/List */}
        {filteredData.length === 0 ? (
            <Card className="p-8 text-center">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2" style={{ color: '#000000' }}>No properties found</h3>
              <p style={{ color: '#4b5563' }}>Try adjusting your search or filters</p>
            </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredData.map((property) => (
              <PropertyCard
                key={property['Property ID']}
                property={property}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}