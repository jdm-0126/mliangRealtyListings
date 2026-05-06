'use client'

import React, { useState } from 'react'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { X, Save } from 'lucide-react'

interface SaveFacebookPostProps {
  property: any
  onClose: () => void
  onSuccess: () => void
}

export default function SaveFacebookPost({ property, onClose, onSuccess }: SaveFacebookPostProps) {
  const [messengerName, setMessengerName] = useState('')
  const [location, setLocation] = useState(property.Location || '')
  const [price, setPrice] = useState(property['Listing Price'] || property.ListingPrice || property.Price || '')
  const [size, setSize] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [messengerUrl, setMessengerUrl] = useState('')
  const [saving, setSaving] = useState(false)

  // Initialize size from property data
  React.useEffect(() => {
    const lotArea = property['Lot Area'] || property.LotArea || ''
    const floorArea = property['Floor Area'] || property.FloorArea || ''
    
    let sizeText = ''
    if (lotArea && floorArea) {
      sizeText = `${lotArea} lot, ${floorArea} floor`
    } else if (lotArea) {
      sizeText = lotArea
    } else if (floorArea) {
      sizeText = floorArea
    }
    setSize(sizeText)
  }, [property])

  const handleSave = async () => {
    if (!messengerName.trim()) {
      alert('Please enter messenger name')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('facebook_posts')
        .insert([
          {
            property_id: property['Property ID'],
            messenger_name: messengerName,
            location: location,
            price: price,
            size: size,
            facebook_url: facebookUrl,
            messenger_url: messengerUrl,
            created_at: new Date().toISOString()
          }
        ])

      if (error) throw error

      alert('Facebook post saved successfully!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving Facebook post:', error)
      alert('Failed to save Facebook post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: '#000000' }}>Save Facebook Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Messenger Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={messengerName}
              onChange={(e) => setMessengerName(e.target.value)}
              placeholder="Enter contact person's messenger name"
              style={{ color: '#000000' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Location
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
              style={{ color: '#000000' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Price
            </label>
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
              style={{ color: '#000000' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Size
            </label>
            <Input
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="Enter size (e.g., 200 sqm lot, 150 sqm floor)"
              style={{ color: '#000000' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Facebook Post/Marketplace URL
            </label>
            <Input
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/..."
              style={{ color: '#000000' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
              Messenger URL (Owner)
            </label>
            <Input
              value={messengerUrl}
              onChange={(e) => setMessengerUrl(e.target.value)}
              placeholder="https://m.me/..."
              style={{ color: '#000000' }}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
