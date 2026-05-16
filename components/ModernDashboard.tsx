'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import PropertyCard from './PropertyCard'
import PropertyDialog from './PropertyDialog'
import QuickAddProperty from './QuickAddProperty'
import SaveFacebookPost from './SaveFacebookPost'
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid3X3, 
  List,
  Upload,
  BarChart3,
  Home,
  MapPin,
  DollarSign
} from 'lucide-react'

export default function ModernDashboard() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRows, setSelectedRows] = useState<any[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRow, setEditingRow] = useState<any>(null)
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('')
  const [priceFilter, setPriceFilter] = useState<string>('')
  const [sizeFilter, setSizeFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showSaveFBPost, setShowSaveFBPost] = useState(false)
  const [selectedPropertyForFB, setSelectedPropertyForFB] = useState<any>(null)
  const [showEditDelete, setShowEditDelete] = useState(false)

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
      console.error('Error fetching data:', error)
      setLoading(false)
      return
    }
    console.log('Fetched data:', data)
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
      filtered = filtered.filter(row => {
        // Adjust Property ID for display
        const displayPropertyId = row['Property ID'] > 2 ? row['Property ID'] - 1 : row['Property ID']
        
        return Object.entries(row).some(([key, value]) => {
          // For Property ID, search using the adjusted display value
          if (key === 'Property ID') {
            return String(displayPropertyId).toLowerCase().includes(searchText.toLowerCase())
          }
          // For other fields, search normally
          return String(value).toLowerCase().includes(searchText.toLowerCase())
        })
      })
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter(row =>
        (row.Location || row.Address || '').toLowerCase().includes(locationFilter.toLowerCase())
      )
    }

    // Apply price filter
    if (priceFilter) {
      const priceInput = priceFilter.toLowerCase().trim()
      filtered = filtered.filter(row => {
        const price = parseFloat(String(row['Listing Price'] || row.ListingPrice || row.Price || '0').replace(/[^\d.]/g, '')) || 0
        
        // Handle "under" or "below" patterns
        if (priceInput.includes('under') || priceInput.includes('below') || priceInput.includes('less than')) {
          const match = priceInput.match(/(\d+(?:\.\d+)?)\s*m?/i)
          if (match) {
            const maxPrice = parseFloat(match[1]) * 1000000
            return price <= maxPrice
          }
        }
        
        // Handle "above" or "over" patterns
        else if (priceInput.includes('above') || priceInput.includes('over') || priceInput.includes('more than')) {
          const match = priceInput.match(/(\d+(?:\.\d+)?)\s*m?/i)
          if (match) {
            const minPrice = parseFloat(match[1]) * 1000000
            return price >= minPrice
          }
        }
        
        // Handle range patterns (e.g., "2M to 5M", "1.5-3.5", "2 - 4M")
        else if (priceInput.includes('to') || priceInput.includes('-')) {
          const matches = priceInput.match(/(\d+(?:\.\d+)?)\s*m?\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)\s*m?/i)
          if (matches) {
            const minPrice = parseFloat(matches[1]) * 1000000
            const maxPrice = parseFloat(matches[2]) * 1000000
            return price >= minPrice && price <= maxPrice
          }
        }
        
        // Handle "around" or "approximately" patterns
        else if (priceInput.includes('around') || priceInput.includes('about') || priceInput.includes('approx')) {
          const match = priceInput.match(/(\d+(?:\.\d+)?)\s*m?/i)
          if (match) {
            const targetPrice = parseFloat(match[1]) * 1000000
            const tolerance = targetPrice * 0.2 // 20% tolerance
            return price >= (targetPrice - tolerance) && price <= (targetPrice + tolerance)
          }
        }
        
        // Handle exact price or single number (assume millions)
        else {
          const match = priceInput.match(/^(\d+(?:\.\d+)?)\s*m?$/i)
          if (match) {
            const targetPrice = parseFloat(match[1]) * 1000000
            const tolerance = targetPrice * 0.1 // 10% tolerance for exact matches
            return price >= (targetPrice - tolerance) && price <= (targetPrice + tolerance)
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

  const handleCreate = () => {
    setEditingRow(null)
    setOpenDialog(true)
  }

  const handleEdit = (property: any) => {
    setEditingRow(property)
    setOpenDialog(true)
  }

  const handleDialogClose = () => {
    setOpenDialog(false)
    setEditingRow(null)
    fetchData()
  }

  const handleHide = async (property: any) => {
    if (!supabase) return
    
    const confirmHide = confirm(`Hide Property #${property['Property ID'] > 2 ? property['Property ID'] - 1 : property['Property ID']}? This will set status to Draft.`)
    if (!confirmHide) return
    
    const { error } = await supabase
      .from('mlianglistings')
      .update({ Status: 'Draft' })
      .eq('Property ID', property['Property ID'])
    
    if (error) {
      alert('Error hiding property: ' + error.message)
    } else {
      alert('Property hidden successfully!')
      fetchData()
    }
  }

  const handleDelete = async (property: any) => {
    if (!supabase) return
    
    const confirmDelete = confirm(`Delete Property #${property['Property ID'] > 2 ? property['Property ID'] - 1 : property['Property ID']}? This action cannot be undone.`)
    if (!confirmDelete) return
    
    const { error } = await supabase
      .from('mlianglistings')
      .delete()
      .eq('Property ID', property['Property ID'])
    
    if (error) {
      alert('Error deleting property: ' + error.message)
    } else {
      alert('Property deleted successfully!')
      fetchData()
    }
  }

  const copyToClipboard = (row: any) => {
    const hasPhotos = Object.keys(row).some(key => key.toLowerCase().includes('photo') && row[key])
    const hasVideo = Object.keys(row).some(key => key.toLowerCase().includes('video') && row[key])
    
    let mediaInfo = ''
    if (hasPhotos && hasVideo) {
      mediaInfo = '\n\nPM for Photos and Video'
    } else if (hasPhotos) {
      mediaInfo = '\n\nPM for Photos'
    } else if (hasVideo) {
      mediaInfo = '\n\nPM for Video'
    }
    
    const lotArea = row['Lot Area'] || row.LotArea || ''
    const floorArea = row['Floor Area'] || row.FloorArea || ''
    const notes = (row.Notes || '').replace(/[^\w\s.,;:()\-₱\n]/g, '')
    
    let areaInfo = ''
    if (lotArea) {
      areaInfo += `\nLot Area : ${lotArea}`
    }
    if (floorArea) {
      areaInfo += `\nFloor Area : ${floorArea}`
    }
    
    const text = `HOUSE AND LOT FOR SALE

${row.Village || ''},
${row.Location || ''},

${row['Listing Price'] || row.ListingPrice || row.Price || ''}${areaInfo}

${notes}

CGT - ${row.CGT || ''}
Transfer - ${row['Transfer Title'] || ''}

Marquez Realty
LICENSED REAL ESTATE BROKER
PRC NO. 0019653
09393440944

#realestate #realtor #realtorlife #realestateagent #property #home #broker #forsale #justlisted #newlisting #listingagent #homesforsale #houseforsale #homeforsale #firsttimehomebuyer #homebuyers #househunting #newhome #dreamhome #homeownership #investmentproperty #homedecor #luxurylifestyle #luxuryhomes #homesweethome #SanFernando #Pampanga #Philippines${mediaInfo}`
    
    navigator.clipboard.writeText(text)
    alert('Facebook post format copied to clipboard!')
  }

  const shareItem = (row: any) => {
    const text = Object.entries(row).map(([key, val]) => `${key}: ${val}`).join('\n')
    if (navigator.share) {
      navigator.share({ title: 'Marquez Listing', text })
    } else {
      copyToClipboard(row)
    }
  }

  const postToFacebook = (row: any) => {
    setSelectedPropertyForFB(row)
    setShowSaveFBPost(true)
  }

  // Calculate statistics
  const stats = {
    total: data.length,
    active: data.filter(item => item.Status === 'Active').length,
    draft: data.filter(item => item.Status === 'Draft').length,
    residential: data.filter(item => item.Type === 'Residential').length,
    lots: data.filter(item => item.Type === 'Lot').length,
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>Property Dashboard</h1>
              <p style={{ color: '#4b5563' }}>Manage your real estate listings</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium" style={{ color: '#4b5563' }}>Total Properties</p>
                    <p className="text-2xl font-bold" style={{ color: '#000000' }}>{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium" style={{ color: '#4b5563' }}>Active</p>
                    <p className="text-2xl font-bold" style={{ color: '#000000' }}>{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium" style={{ color: '#4b5563' }}>Draft</p>
                    <p className="text-2xl font-bold" style={{ color: '#000000' }}>{stats.draft}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Home className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium" style={{ color: '#4b5563' }}>Residential</p>
                    <p className="text-2xl font-bold" style={{ color: '#000000' }}>{stats.residential}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <MapPin className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium" style={{ color: '#4b5563' }}>Lots</p>
                    <p className="text-2xl font-bold" style={{ color: '#000000' }}>{stats.lots}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Controls */}
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
                  {/* Filters */}
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
                      placeholder="Budget (e.g., 2M to 5M, Under 3M, Above 10M, Around 4.5M)"
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-80"
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
                    
                    <Button
                      variant={showEditDelete ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowEditDelete(!showEditDelete)}
                    >
                      {showEditDelete ? 'Hide' : 'Show'} Edit/Delete
                    </Button>
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

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleCreate} className="flex-shrink-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </Button>
                <Button variant="outline" onClick={() => setShowQuickAdd(true)} className="flex-shrink-0">
                  <Upload className="w-4 h-4 mr-2" />
                  Quick Add
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/upload'} className="flex-shrink-0">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>

              <div className="text-sm" style={{ color: '#4b5563' }}>
                Showing {filteredData.length} of {data.length} properties
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid/List */}
        {data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No properties found</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredData.map((property) => (
              <PropertyCard
                key={property['Property ID']}
                property={property}
                viewMode={viewMode}
                onEdit={showEditDelete ? handleEdit : undefined}
                onShare={shareItem}
                onCopy={copyToClipboard}
                onFacebookPost={postToFacebook}
                onHide={showEditDelete ? handleHide : undefined}
                onDelete={showEditDelete ? handleDelete : undefined}
              />
            ))}
          </div>
        )}

        {/* Property Dialog */}
        {openDialog && (
          <PropertyDialog
            property={editingRow}
            isOpen={openDialog}
            onClose={handleDialogClose}
            columns={data.length > 0 ? Object.keys(data[0]) : []}
          />
        )}

        {/* Quick Add Property */}
        {showQuickAdd && (
          <QuickAddProperty
            onClose={() => setShowQuickAdd(false)}
            onSuccess={fetchData}
          />
        )}

        {/* Save Facebook Post */}
        {showSaveFBPost && selectedPropertyForFB && (
          <SaveFacebookPost
            property={selectedPropertyForFB}
            onClose={() => {
              setShowSaveFBPost(false)
              setSelectedPropertyForFB(null)
            }}
            onSuccess={fetchData}
          />
        )}
      </div>
    </div>
  )
}