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
import BuyerInquiryParser from './BuyerInquiryParser'
import { Pagination } from './ui/Pagination'
import { Tooltip } from './ui/tooltip'
import { loadRecentSearches, clearRecentSearchesStorage, truncateQuery, type RecentSearchEntry } from '@/lib/recentSearches'
import { parsePropertyQuery, filterPropertiesByQuery } from '@/lib/parsePropertyQuery'
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
  DollarSign,
  ChevronUp,
  ChevronDown,
  Settings2,
  MoreVertical,
  Eye,
  EyeOff,
  MessageSquare,
  Clock,
  X
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
  const [chatRecentSearches, setChatRecentSearches] = useState<RecentSearchEntry[]>([])
  const [activeRecentQuery, setActiveRecentQuery] = useState<string>('')

  const [showEditDelete, setShowEditDelete] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showBuyerInquiry, setShowBuyerInquiry] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [pageSize, setPageSize] = useState(24)
  const [currentPage, setCurrentPage] = useState(1)
  const [isClient, setIsClient] = useState(false)
  const optionsMenuRef = React.useRef<HTMLDivElement>(null)

  const SETTINGS_KEY = 'tenantSettings'
  const [tenantSettings, setTenantSettings] = useState({
    businessName: 'M. Liang Realty',
    brokerName: 'Melanie Liang',
    brokerTitle: 'Licensed Real Estate Broker',
    prcNumber: '0019653',
    officeAddress: 'S10, 2nd Floor Plaza Cristina Building, Dolores, City of San Fernando, Pampanga',
    contactNumber: '09393440944',
    emailAddress: '',
  })

  // Client-side only flag
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load chat recent searches on mount and whenever the filter panel opens
  useEffect(() => {
    setChatRecentSearches(loadRecentSearches())
  }, [])

  useEffect(() => {
    if (showFilters) {
      setChatRecentSearches(loadRecentSearches())
    }
  }, [showFilters])

  // Load settings from localStorage only on client
  useEffect(() => {
    if (!isClient) return
    
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setTenantSettings(prev => ({ ...prev, ...parsed }))
      } catch {}
    }
  }, [isClient])

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

    // If a recent chat search is active, run it through the shared parser and
    // skip the individual field filters (they've been cleared by handleApplyRecentSearch).
    if (activeRecentQuery) {
      const parsed = parsePropertyQuery(activeRecentQuery)
      filtered = filterPropertiesByQuery(data, parsed)
      filtered = [...filtered].sort((a, b) => Number(b['Property ID']) - Number(a['Property ID']))
      setFilteredData(filtered)
      setCurrentPage(1)
      return
    }

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
    setCurrentPage(1)
  }, [data, searchText, statusFilter, typeFilter, locationFilter, priceFilter, sizeFilter, sortBy, activeRecentQuery])

  const handleCreate = () => {
    setEditingRow(null)
    setOpenDialog(true)
  }

  /**
   * Apply a chat recent search query to the dashboard filters.
   * Parses price, type, location, and size hints from the natural-language query.
   */
  const handleApplyRecentSearch = (entry: RecentSearchEntry) => {
    // Store the raw query — the filter useEffect will apply it via parsePropertyQuery
    setActiveRecentQuery(entry.query)
    // Clear all individual filter fields so they don't conflict
    setStatusFilter('all')
    setTypeFilter('all')
    setLocationFilter('')
    setPriceFilter('')
    setSizeFilter('')
    setSortBy('newest')
    setSearchText('')
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

  const buildPostText = (row: any) => {
    const hasPhotos = Object.keys(row).some(key => key.toLowerCase().includes('photo') && row[key])
    const hasVideo = Object.keys(row).some(key => key.toLowerCase().includes('video') && row[key])
    let mediaInfo = ''
    if (hasPhotos && hasVideo) mediaInfo = '\n\nPM for Photos and Video'
    else if (hasPhotos) mediaInfo = '\n\nPM for Photos'
    else if (hasVideo) mediaInfo = '\n\nPM for Video'

    const lotArea = row['Lot Area'] || row.LotArea || ''
    const floorArea = row['Floor Area'] || row.FloorArea || ''
    const notes = (row.Notes || '').replace(/[^\w\s.,;:()\-₱\n]/g, '')
    let areaInfo = ''
    if (lotArea) areaInfo += `\nLot Area : ${lotArea}`
    if (floorArea) areaInfo += `\nFloor Area : ${floorArea}`

    return `HOUSE AND LOT FOR SALE

${row.Village || ''},
${row.Location || ''},

${row['Listing Price'] || row.ListingPrice || row.Price || ''}${areaInfo}

${notes}

CGT - ${row.CGT || ''}
Transfer - ${row['Transfer Title'] || ''}

${tenantSettings.businessName}
${tenantSettings.brokerName}
${tenantSettings.brokerTitle}
PRC No. ${tenantSettings.prcNumber}
${tenantSettings.officeAddress}
${tenantSettings.contactNumber}${tenantSettings.emailAddress ? '\n' + tenantSettings.emailAddress : ''}

#realestate #realtor #realtorlife #realestateagent #property #home #broker #forsale #justlisted #newlisting #listingagent #homesforsale #houseforsale #homeforsale #firsttimehomebuyer #homebuyers #househunting #newhome #dreamhome #homeownership #investmentproperty #homedecor #luxurylifestyle #luxuryhomes #homesweethome #SanFernando #Pampanga #Philippines${mediaInfo}`
  }

  const copyToClipboard = (row: any) => {
    navigator.clipboard.writeText(buildPostText(row))
    alert('Facebook post format copied to clipboard!')
  }

  const shareItem = (row: any) => {
    if (navigator.share) {
      navigator.share({ title: tenantSettings.businessName, text: buildPostText(row) })
    } else {
      copyToClipboard(row)
    }
  }

  const handleInstagramPost = (row: any) => {
    navigator.clipboard.writeText(buildPostText(row))
    alert('Caption copied! Open the Instagram app and paste it into your post/reel caption.')
  }

  const handleTikTokPost = (row: any) => {
    navigator.clipboard.writeText(buildPostText(row))
    alert('Caption copied! Open the TikTok app and paste it into your video caption.')
  }

  const postToFacebook = (row: any) => {
    const text = encodeURIComponent(buildPostText(row))
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${text}&u=https://www.facebook.com/`, '_blank', 'noopener,noreferrer')
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
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-gray-50 pb-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-3xl font-bold" style={{ color: '#000000' }}>Dashboard</h2>
              {/* <p style={{ color: '#4b5563' }}>Manage your real estate listings</p> */}
            </div>
            <div className="flex gap-2">
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
                  variant={showEditDelete ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowEditDelete(!showEditDelete)}
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  {showEditDelete ? 'Editing On' : 'Edit'}
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
                        setShowStats(!showStats)
                        setShowOptionsMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      style={{ color: '#000000' }}
                    >
                      {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showStats ? 'Show Statistics' : 'Hide Statistics'}
                    </button>
                    <button
                      onClick={() => {
                        setShowBuyerInquiry(!showBuyerInquiry)
                        setShowOptionsMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      style={{ color: '#000000' }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {showBuyerInquiry ? 'Hide' : 'Show'} Buyer Inquiry
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
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
        </div>

        {/* Statistics Cards */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
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
        )}

        {/* Buyer Inquiry Parser */}
        {showBuyerInquiry && <BuyerInquiryParser allProperties={data} />}

        {/* Recent Searches Bar — always visible when there are saved searches */}
        {chatRecentSearches.length > 0 && (
          <div className="mb-4 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5" />
                Recent Chat Searches
              </div>
              <div className="flex items-center gap-3">
                {activeRecentQuery && (
                  <span className="text-xs text-blue-600 font-medium">
                    {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
                  </span>
                )}
                {activeRecentQuery && (
                  <button
                    onClick={() => setActiveRecentQuery('')}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear search
                  </button>
                )}
                <button
                  onClick={() => {
                    clearRecentSearchesStorage()
                    setChatRecentSearches([])
                    setActiveRecentQuery('')
                  }}
                  className="text-xs text-red-400 hover:text-red-600 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {chatRecentSearches.map((entry, i) => {
                const isActive = activeRecentQuery === entry.query
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (isActive) {
                        setActiveRecentQuery('')
                      } else {
                        handleApplyRecentSearch(entry)
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 text-xs border rounded-full px-3 py-1.5 transition-all ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                    title={entry.query}
                  >
                    <Search className="w-3 h-3 flex-shrink-0" />
                    <span className="max-w-[220px] truncate">{truncateQuery(entry.query, 45)}</span>
                    {isActive && <X className="w-3 h-3 flex-shrink-0 opacity-70" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              {/* Search */}
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

              {/* Filters - Collapsible */}
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
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Budget</label>
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

                  {/* Bottom row: clear filters */}
                  <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setStatusFilter('all')
                          setTypeFilter('all')
                          setLocationFilter('')
                          setPriceFilter('')
                          setSizeFilter('')
                          setSortBy('newest')
                          setSearchText('')
                          setActiveRecentQuery('')
                        }}
                        className="text-xs text-red-500 hover:text-red-700 underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mr-2">
                <Button onClick={handleCreate} className="flex-shrink-0 ">
                  <Plus className="w-2 h-4 mr-2" />
                  Add Listing
                </Button>
                <Tooltip content="Add property via paste">
                  <Button variant="outline" onClick={() => setShowQuickAdd(true)} className="flex-shrink-0 mr-2">
                    <Upload className="w-2 h-4 mr-2" />
                    Quick Add
                  </Button>
                </Tooltip>
               <div className="flex right-4">
                  <button
                      onClick={() => {
                        setViewMode('grid')
                        setShowOptionsMenu(false)
                      }}
                      className={`w-full px-4 py-2 text-right text-sm hover:bg-gray-100 flex items-center gap-2 ${
                        viewMode === 'grid' ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                      style={{ color: viewMode === 'grid' ? '#1d4ed8' : '#000000' }}
                    >
                      <Grid3X3 className="w-4 h-4" />
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
                    </button>
                </div> 
              </div>
              

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm" style={{ color: '#4b5563' }}>
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)}–{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}
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

        {/* Properties Grid/List */}
        {data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No properties found</p>
          </div>
        ) : (
          <>
            <div className={
              viewMode === 'grid' 
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
                    onEdit={showEditDelete ? handleEdit : undefined}
                    onShare={shareItem}
                    onCopy={copyToClipboard}
                    onFacebookPost={postToFacebook}
                    onInstagramPost={handleInstagramPost}
                    onTikTokPost={handleTikTokPost}
                    onHide={showEditDelete ? handleHide : undefined}
                    onDelete={showEditDelete ? handleDelete : undefined}
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


      </div>
    </div>
  )
}