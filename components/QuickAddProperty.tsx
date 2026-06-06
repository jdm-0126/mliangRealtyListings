'use client'

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { supabase } from '@/app/lib/supabaseClient.js'
import { X } from 'lucide-react'

interface ParsedProperty {
  title: string
  location: string
  price?: string
  lotArea?: string
  floorArea?: string
  bedrooms?: string
  bathrooms?: string
  description: string
  type: string
  listingMode: 'For Sale' | 'For Rent'
  photoUrl?: string
  facebookUrl?: string
  mop?: string
}

export default function QuickAddProperty({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [pastedText, setPastedText] = useState('')
  const [parsedData, setParsedData] = useState<ParsedProperty | null>(null)
  const [loading, setLoading] = useState(false)

  const parsePropertyText = (text: string): ParsedProperty | null => {
    try {
      // Clean HTML entities
      text = text.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
      
      // Extract Property ID from first line if present (e.g., "Property #123" or "#123")
      const firstLine = text.split('\n')[0]
      const propertyIdMatch = firstLine.match(/(?:#|Property\s*#?)\s*(\d+)/i)
      const propertyId = propertyIdMatch ? propertyIdMatch[1] : ''
      
      // Extract title (first line or line after FOR SALE/RENT)
      let title = ''
      const titleMatch = text.match(/FOR\s*(?:SALE|RENT)[‼️!]*\s*[✨]*\s*(.+?)(?:\n|📍)/i)
      if (titleMatch) {
        title = titleMatch[1].trim()
      } else {
        // Use first non-empty line as title
        const lines = text.split('\n').filter(l => l.trim())
        title = lines[0] ? lines[0].trim() : ''
      }
      
      // Extract location
      const locationMatch = text.match(/📍\s*(.+?)(?:\n|👉)/i)
      const location = locationMatch ? locationMatch[1].trim() : ''
      
      // Extract price
      const priceMatch = text.match(/₱([\d.,]+[MmKk]?)/i)
      const price = priceMatch ? priceMatch[1].trim() : ''
      
      // Extract lot area - recognize multiple patterns
      let lotArea = ''
      // Pattern 1: "Total Lot Area: 4,000 sqm"
      const totalLotMatch = text.match(/Total Lot Area[:\s]*([\d,]+)\s*sqm/i)
      if (totalLotMatch) {
        lotArea = totalLotMatch[1].replace(/,/g, '').trim()
      } else {
        // Pattern 2: Standard "Lot Area: 100 sqm"
        const lotMatch = text.match(/Lot Area[:\s]*([\d,]+)\s*sqm/i)
        lotArea = lotMatch ? lotMatch[1].replace(/,/g, '').trim() : ''
      }
      
      // Extract floor area - recognize multiple patterns
      let floorArea = ''
      // Pattern 1: "House Lot Area: approx. 1,000 sqm"
      const houseLotMatch = text.match(/House Lot Area[:\s]*(?:approx\.?\s*)?([\d,]+)\s*sqm/i)
      if (houseLotMatch) {
        floorArea = houseLotMatch[1].replace(/,/g, '').trim()
      } else {
        // Pattern 2: Standard "Floor Area: 100 sqm"
        const floorMatch = text.match(/Floor Area[:\s]*([\d,]+)\s*sqm/i)
        floorArea = floorMatch ? floorMatch[1].replace(/,/g, '').trim() : ''
      }
      
      // Extract bedrooms
      const bedroomMatch = text.match(/(\d+)\s*Bedroom/i)
      const bedrooms = bedroomMatch ? bedroomMatch[1] : ''
      
      // Extract bathrooms
      const bathroomMatch = text.match(/(\d+)\s*Toilet\s*&\s*Bath/i)
      const bathrooms = bathroomMatch ? bathroomMatch[1] : ''
      
      // Extract Facebook URL - recognize multiple patterns
      const fbMatch = text.match(/(https?:\/\/(?:www\.|m\.)?facebook\.com\/(?:share\/p\/|[^\s]+)|https?:\/\/fb\.com\/[^\s]+)/i)
      const facebookUrl = fbMatch ? fbMatch[1].trim() : ''
      
      // Extract photo URL (Google Photos, Drive, or any image URL) - but NOT Facebook URLs
      const photoMatch = text.match(/(https?:\/\/[^\s]+(?:photos\.google\.com|photos\.app\.goo\.gl|drive\.google\.com|\.jpg|\.jpeg|\.png|\.gif|\.webp)[^\s]*)/i)
      let photoUrl = photoMatch ? photoMatch[1].trim() : ''
      
      // Make sure photo URL is not a Facebook URL
      if (photoUrl && photoUrl.includes('facebook.com')) {
        photoUrl = ''
      }
      
      // Determine property type
      let type = 'Residential'
      if (text.toLowerCase().includes('bungalow') || text.toLowerCase().includes('house')) {
        type = 'Residential'
      } else if (text.toLowerCase().includes('lot only')) {
        type = 'Lot'
      } else if (text.toLowerCase().includes('commercial')) {
        type = 'Commercial'
      }

      // Determine listing mode — default For Sale, detect For Rent
      const listingMode: 'For Sale' | 'For Rent' =
        /for\s*rent/i.test(text) ? 'For Rent' : 'For Sale'
      
      // Extract full description (everything after property details)
      const description = text.trim()
      
      return {
        title,
        location,
        price,
        lotArea,
        floorArea,
        bedrooms,
        bathrooms,
        description,
        type,
        listingMode,
        photoUrl,
        facebookUrl,
        mop: 'Bank Financing', // Default MOP
      }
    } catch (error) {
      console.error('Error parsing text:', error)
      return null
    }
  }

  const handleParse = () => {
    const parsed = parsePropertyText(pastedText)
    if (parsed) {
      setParsedData(parsed)
    } else {
      alert('Could not parse the property details. Please check the format.')
    }
  }

  const handleSave = async () => {
    if (!parsedData || !supabase) return
    
    // Validate required fields
    if (!parsedData.description || !parsedData.description.trim()) {
      alert('Description is required!')
      return
    }
    
    setLoading(true)
    
    try {
      // Convert price to number
      let priceNum = 0
      if (parsedData.price) {
        const priceStr = parsedData.price.replace(/,/g, '')
        if (priceStr.toLowerCase().includes('m')) {
          priceNum = parseFloat(priceStr) * 1000000
        } else if (priceStr.toLowerCase().includes('k')) {
          priceNum = parseFloat(priceStr) * 1000
        } else {
          priceNum = parseFloat(priceStr)
        }
      }
      
      // Check for duplicates based on location and price
      const { data: existingProperties, error: checkError } = await supabase
        .from('mlianglistings')
        .select('*')
        .eq('Location', parsedData.location)
        .eq('Listing Price', priceNum)
      
      if (checkError) {
        console.error('Error checking duplicates:', checkError)
      } else if (existingProperties && existingProperties.length > 0) {
        const confirmAdd = confirm(
          `Found ${existingProperties.length} similar property(ies) with same location and price.\n\nDo you still want to add this property?`
        )
        if (!confirmAdd) {
          setLoading(false)
          return
        }
      }
      
      const propertyData: any = {
        Title: parsedData.title || '',
        Location: parsedData.location || '',
        'Listing Price': priceNum || 0,
        'Lot Area sqm': parsedData.lotArea || '',
        'Floor Area sqm': parsedData.floorArea || '',
        Photos: parsedData.photoUrl || '',
        'FB Link': parsedData.facebookUrl || '',
        'Listing Mode': parsedData.listingMode || 'For Sale',
        'Financing options': parsedData.mop || 'Bank Financing',
        Notes: parsedData.listingMode === 'For Rent'
          ? `[FOR RENT]\n${parsedData.description || ''}`
          : parsedData.description || '',
        Type: parsedData.type || 'Residential',
        Status: 'Active',
        // CGT and Transfer Title are sale-specific — omit for rentals
        ...(parsedData.listingMode !== 'For Rent' && {
          CGT: 'Seller',
          'Transfer Title': 'Buyer',
        }),
      }
      
      const { error } = await supabase
        .from('mlianglistings')
        .insert([propertyData])
      
      if (error) {
        console.error('Error saving property:', error)
        alert('Error saving property: ' + error.message)
      } else {
        alert('Property added successfully!')
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving property')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Quick Add Property</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                Paste Property Details:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the formatted property text here..."
                className="w-full h-64 p-3 border border-gray-300 rounded-md text-black"
                style={{ color: '#000000' }}
              />
            </div>
            
            <Button onClick={handleParse} className="w-full">
              Parse Details
            </Button>
            
            {parsedData && (
              <Card className="border-2 border-blue-200 shadow-md">
                <CardHeader className="bg-blue-50 border-b border-blue-200">
                  <h3 className="font-semibold text-lg" style={{ color: '#000000' }}>Parsed Property Details</h3>
                  <p className="text-sm text-gray-600 mt-1">Review and edit the parsed information before saving</p>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Title:</label>
                    <input
                      type="text"
                      value={parsedData.title}
                      onChange={(e) => setParsedData({ ...parsedData, title: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded text-black"
                      style={{ color: '#000000' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Location:</label>
                    <input
                      type="text"
                      value={parsedData.location}
                      onChange={(e) => setParsedData({ ...parsedData, location: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded text-black"
                      style={{ color: '#000000' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Price:</label>
                    <input
                      type="text"
                      value={parsedData.price || ''}
                      onChange={(e) => setParsedData({ ...parsedData, price: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded text-black"
                      style={{ color: '#000000' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Type:</label>
                    <select
                      value={parsedData.type}
                      onChange={(e) => setParsedData({ ...parsedData, type: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded text-black"
                      style={{ color: '#000000' }}
                    >
                      <option value="Residential">Residential</option>
                      <option value="Lot">Lot</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Listing Mode:</label>
                    <div className="flex gap-3">
                      {(['For Sale', 'For Rent'] as const).map(mode => (
                        <label
                          key={mode}
                          className={`flex-1 flex items-center justify-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                            parsedData.listingMode === mode
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="listingMode"
                            value={mode}
                            checked={parsedData.listingMode === mode}
                            onChange={() => setParsedData({ ...parsedData, listingMode: mode })}
                            className="hidden"
                          />
                          {mode === 'For Sale' ? '🏷️' : '🔑'} {mode}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Mode of Payment:</label>
                    <select
                      value={parsedData.mop || 'Bank Financing'}
                      onChange={(e) => setParsedData({ ...parsedData, mop: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded text-black"
                      style={{ color: '#000000' }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Financing">Bank Financing</option>
                      <option value="Pagibig">Pagibig</option>
                      <option value="Inhouse">Inhouse</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Lot Area (sqm):</label>
                    <input
                      type="text"
                      value={parsedData.lotArea || ''}
                      onChange={(e) => setParsedData({ ...parsedData, lotArea: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded text-black"
                      style={{ color: '#000000' }}
                      placeholder="e.g., 100"
                      name="Lot Area"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Floor Area (sqm):</label>
                    <input
                      type="text"
                      value={parsedData.floorArea || ''}
                      onChange={(e) => setParsedData({ ...parsedData, floorArea: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded text-black"
                      style={{ color: '#000000' }}
                      placeholder="e.g., 80"
                      name="Floor Area"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Bedrooms (optional):</label>
                    <input
                      type="text"
                      value={parsedData.bedrooms || ''}
                      onChange={(e) => setParsedData({ ...parsedData, bedrooms: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded text-black"
                      style={{ color: '#000000' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Bathrooms (optional):</label>
                    <input
                      type="text"
                      value={parsedData.bathrooms || ''}
                      onChange={(e) => setParsedData({ ...parsedData, bathrooms: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded text-black"
                      style={{ color: '#000000' }}
                    />
                  </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#4b5563' }}>
                      Description: <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={parsedData.description}
                      onChange={(e) => setParsedData({ ...parsedData, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded h-32 text-black"
                      style={{ color: '#000000' }}
                      required
                    />
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#4b5563' }}>Google Photos Link (Optional)</label>
                    <input
                      type="text"
                      value={parsedData.photoUrl || ''}
                      onChange={(e) => setParsedData({ ...parsedData, photoUrl: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded text-black"
                      style={{ color: '#000000' }}
                      placeholder="Paste Google Photos album link here..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#4b5563' }}>FB Link (Optional)</label>
                    <input
                      type="text"
                      value={parsedData.facebookUrl || ''}
                      onChange={(e) => setParsedData({ ...parsedData, facebookUrl: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded text-black"
                      style={{ color: '#000000' }}
                      placeholder="Paste Facebook post or marketplace link here..."
                    />
                  </div>
                </CardContent>
                
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleSave} disabled={loading} className="flex-1 h-12 text-base">
                      {loading ? 'Saving...' : '✓ Save Property'}
                    </Button>
                    <Button variant="outline" onClick={() => setParsedData(null)} className="flex-1 h-12 text-base">
                      ← Edit Text
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
