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
}

export default function QuickAddProperty({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [pastedText, setPastedText] = useState('')
  const [parsedData, setParsedData] = useState<ParsedProperty | null>(null)
  const [loading, setLoading] = useState(false)

  const parsePropertyText = (text: string): ParsedProperty | null => {
    try {
      // Clean HTML entities
      text = text.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
      
      // Extract title (first line after FOR SALE)
      const titleMatch = text.match(/FOR SALE[‼️!]*\s*[✨]*\s*(.+?)(?:\n|📍)/i)
      const title = titleMatch ? titleMatch[1].trim() : ''
      
      // Extract location
      const locationMatch = text.match(/📍\s*(.+?)(?:\n|👉)/i)
      const location = locationMatch ? locationMatch[1].trim() : ''
      
      // Extract price
      const priceMatch = text.match(/₱([\d.,]+[MmKk]?)/i)
      const price = priceMatch ? priceMatch[1].trim() : ''
      
      // Extract lot area
      const lotMatch = text.match(/Lot Area[:\s]*(\d+\s*sqm)/i)
      const lotArea = lotMatch ? lotMatch[1].trim() : ''
      
      // Extract floor area
      const floorMatch = text.match(/Floor Area[:\s]*(\d+\s*sqm)/i)
      const floorArea = floorMatch ? floorMatch[1].trim() : ''
      
      // Extract bedrooms
      const bedroomMatch = text.match(/(\d+)\s*Bedroom/i)
      const bedrooms = bedroomMatch ? bedroomMatch[1] : ''
      
      // Extract bathrooms
      const bathroomMatch = text.match(/(\d+)\s*Toilet\s*&\s*Bath/i)
      const bathrooms = bathroomMatch ? bathroomMatch[1] : ''
      
      // Determine property type
      let type = 'Residential'
      if (text.toLowerCase().includes('bungalow') || text.toLowerCase().includes('house')) {
        type = 'Residential'
      } else if (text.toLowerCase().includes('lot only')) {
        type = 'Lot'
      } else if (text.toLowerCase().includes('commercial')) {
        type = 'Commercial'
      }
      
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
        type
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
      
      const propertyData = {
        Title: parsedData.title,
        Location: parsedData.location,
        'Listing Price': priceNum,
        'Lot Area': parsedData.lotArea,
        'Floor Area': parsedData.floorArea,
        Notes: parsedData.description,
        Type: parsedData.type,
        Status: 'Active',
        CGT: 'Seller',
        'Transfer Title': 'Buyer'
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
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quick Add Property</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                Paste Property Details:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the formatted property text here..."
                className="w-full h-64 p-3 border rounded-md"
                style={{ color: '#000000' }}
              />
            </div>
            
            <Button onClick={handleParse} className="w-full">
              Parse Details
            </Button>
            
            {parsedData && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3" style={{ color: '#000000' }}>Parsed Property Details:</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium" style={{ color: '#4b5563' }}>Title:</span>
                    <p style={{ color: '#000000' }}>{parsedData.title || 'Not found'}</p>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: '#4b5563' }}>Location:</span>
                    <p style={{ color: '#000000' }}>{parsedData.location || 'Not found'}</p>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: '#4b5563' }}>Price:</span>
                    <p style={{ color: '#000000' }}>{parsedData.price || 'Not found'}</p>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: '#4b5563' }}>Type:</span>
                    <p style={{ color: '#000000' }}>{parsedData.type}</p>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: '#4b5563' }}>Lot Area:</span>
                    <p style={{ color: '#000000' }}>{parsedData.lotArea || 'Not found'}</p>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: '#4b5563' }}>Floor Area:</span>
                    <p style={{ color: '#000000' }}>{parsedData.floorArea || 'Not found'}</p>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: '#4b5563' }}>Bedrooms:</span>
                    <p style={{ color: '#000000' }}>{parsedData.bedrooms || 'Not found'}</p>
                  </div>
                  <div>
                    <span className="font-medium" style={{ color: '#4b5563' }}>Bathrooms:</span>
                    <p style={{ color: '#000000' }}>{parsedData.bathrooms || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleSave} disabled={loading} className="flex-1">
                    {loading ? 'Saving...' : 'Save Property'}
                  </Button>
                  <Button variant="outline" onClick={() => setParsedData(null)}>
                    Edit Text
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
