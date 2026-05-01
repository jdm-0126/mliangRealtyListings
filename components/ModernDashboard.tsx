'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import PropertyCard from './PropertyCard'
import PropertyDialog from './PropertyDialog'
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
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRows, setSelectedRows] = useState<any[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRow, setEditingRow] = useState<any>(null)
  const [searchText, setSearchText] = useState('')
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [sortBy, setSortBy] = useState('Property ID')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showStats, setShowStats] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

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
      const aVal = sortBy === 'Property ID' ? Number(a[sortBy]) || 0 : String(a[sortBy] || '').toLowerCase()
      const bVal = sortBy === 'Property ID' ? Number(b[sortBy]) || 0 : String(b[sortBy] || '').toLowerCase()
      
      if (sortBy === 'Property ID') {
        return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
      } else {
        return sortOrder === 'asc' ? (aVal as string).localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string)
      }
    })
    
    setFilteredData(filtered)
  }, [data, searchText, sortBy, sortOrder, statusFilter, typeFilter])

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
    
    const text = `‼️HOUSE AND LOT FOR SALE‼️

📍${row.Village || ''},
📍${row.Location || ''},

🏷️${row['Listing Price'] || row.ListingPrice || row.Price || ''}

Lot Area : ${row['Lot Area'] || ''}
Floor Area : ${row['Floor Area'] || ''}

✔️ ${row.Notes || ''}

CGT - ${row.CGT || ''}
Transfer - ${row['Transfer Title'] || ''}

M. Liang Realty
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
      navigator.share({ title: 'MLiang Listing', text })
    } else {
      copyToClipboard(row)
    }
  }

  const postToFacebook = (row: any) => {
    copyToClipboard(row)
    const text = encodeURIComponent(`Property #${row['Property ID']} - ${row.Village}, ${row.Location}`)
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${text}`
    window.open(fbUrl, '_blank', 'width=600,height=400')
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Dashboard</h1>
              <p className="text-gray-600">Manage your real estate listings</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </Button>
          </div>
        </div>

        {/* Statistics Cards - Collapsible */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Properties</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
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
                    <p className="text-sm font-medium text-gray-600">Draft</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
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
                    <p className="text-sm font-medium text-gray-600">Residential</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.residential}</p>
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
                    <p className="text-sm font-medium text-gray-600">Lots</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.lots}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                    </select>

                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                    >
                      <option value="all">All Types</option>
                      <option value="residential">Residential</option>
                      <option value="lot">Lot</option>
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                    >
                      <option value="Property ID">Sort by ID</option>
                      <option value="Village">Sort by Village</option>
                      <option value="Location">Sort by Location</option>
                      <option value="Type">Sort by Type</option>
                    </select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* View Toggle */}
                  <div className="flex gap-1 border border-gray-300 rounded-md p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/upload'}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>

              {searchText && (
                <div className="text-sm text-gray-600">
                  Showing {filteredData.length} out of {data.length} properties
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid/List */}
        {data.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first property listing.</p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </CardContent>
          </Card>
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
                onEdit={handleEdit}
                onShare={shareItem}
                onCopy={copyToClipboard}
                onFacebookPost={postToFacebook}
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
      </div>
    </div>
  )
}