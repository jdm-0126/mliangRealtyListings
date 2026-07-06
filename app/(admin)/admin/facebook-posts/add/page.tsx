'use client'

import React, { useState } from 'react'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Wand2 } from 'lucide-react'

export default function AddFacebookPostPage() {
  const [messengerName, setMessengerName] = useState('')
  const [location, setLocation] = useState('')
  const [price, setPrice] = useState('')
  const [size, setSize] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [messengerUrl, setMessengerUrl] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [saving, setSaving] = useState(false)

  const parseText = () => {
    if (!pasteText.trim()) {
      alert('Please paste some text to parse')
      return
    }

    const text = pasteText
    const lines = text.split('\n').map(line => line.trim()).filter(line => line)

    // Extract Facebook URL
    const fbUrlMatch = text.match(/(https?:\/\/)?(www\.)?(facebook\.com|fb\.com|m\.facebook\.com)\/[^\s]+/i)
    if (fbUrlMatch) {
      setFacebookUrl(fbUrlMatch[0].startsWith('http') ? fbUrlMatch[0] : 'https://' + fbUrlMatch[0])
    }

    // Extract Messenger URL
    const messengerMatch = text.match(/(https?:\/\/)?(www\.)?(m\.me|messenger\.com)\/[^\s]+/i)
    if (messengerMatch) {
      setMessengerUrl(messengerMatch[0].startsWith('http') ? messengerMatch[0] : 'https://' + messengerMatch[0])
    }

    // Extract price (₱ or PHP followed by numbers)
    const priceMatch = text.match(/[₱P][Hh]?[Pp]?\s*([\d,]+(?:\.\d+)?\s*[MmKk]?)/i) || 
                       text.match(/([\d,]+(?:\.\d+)?\s*[MmKk]?)\s*[₱P]/i) ||
                       text.match(/price[:\s]*[₱P]?[Hh]?[Pp]?\s*([\d,]+(?:\.\d+)?\s*[MmKk]?)/i)
    if (priceMatch) {
      const priceValue = priceMatch[1] || priceMatch[0]
      setPrice(priceValue.includes('₱') ? priceValue : '₱' + priceValue)
    }

    // Extract size (sqm, sq.m, square meters)
    const sizeMatch = text.match(/([\d,]+)\s*(?:sqm|sq\.?m|square\s*meters?)/i)
    const lotMatch = text.match(/lot[:\s]*([\d,]+)\s*(?:sqm|sq\.?m)?/i)
    const floorMatch = text.match(/floor[:\s]*([\d,]+)\s*(?:sqm|sq\.?m)?/i)
    
    if (lotMatch && floorMatch) {
      setSize(`${lotMatch[1]} sqm lot, ${floorMatch[1]} sqm floor`)
    } else if (lotMatch) {
      setSize(`${lotMatch[1]} sqm lot`)
    } else if (floorMatch) {
      setSize(`${floorMatch[1]} sqm floor`)
    } else if (sizeMatch) {
      setSize(`${sizeMatch[1]} sqm`)
    }

    // Extract location (common Pampanga cities/municipalities)
    const locations = [
      'San Fernando', 'Angeles City', 'Mabalacat', 'Mexico', 'Bacolor', 'Guagua',
      'Porac', 'Floridablanca', 'Lubao', 'Sta. Rita', 'Santa Rita', 'Apalit',
      'Macabebe', 'Masantol', 'Sasmuan', 'Candaba', 'Arayat', 'Magalang',
      'Santo Tomas', 'San Luis', 'San Simon', 'Minalin'
    ]
    
    for (const loc of locations) {
      const regex = new RegExp(loc, 'i')
      if (regex.test(text)) {
        setLocation(loc)
        break
      }
    }

    // Try to extract messenger name from first line or after "contact:"
    const contactMatch = text.match(/contact[:\s]*([^\n]+)/i)
    const nameMatch = text.match(/name[:\s]*([^\n]+)/i)
    
    if (contactMatch) {
      setMessengerName(contactMatch[1].trim())
    } else if (nameMatch) {
      setMessengerName(nameMatch[1].trim())
    } else if (lines.length > 0 && !lines[0].match(/https?:\/\//)) {
      // Use first line if it doesn't look like a URL
      const firstLine = lines[0]
      if (firstLine.length < 50 && !firstLine.match(/[₱\d]/)) {
        setMessengerName(firstLine)
      }
    }

    alert('Text parsed! Please review and edit the fields as needed.')
  }

  const handleSave = async () => {
    if (!messengerName.trim()) {
      alert('Please enter messenger name')
      return
    }

    if (!supabase) {
      alert('Database connection not available')
      return
    }

    setSaving(true)

    try {
      const insertData: any = {
        property_id: null,
        messenger_name: messengerName,
        created_at: new Date().toISOString()
      }

      if (location) insertData.location = location
      if (price) insertData.price = price
      if (size) insertData.size = size
      if (facebookUrl) insertData.facebook_url = facebookUrl
      if (messengerUrl) insertData.messenger_url = messengerUrl

      const { error } = await supabase
        .from('facebook_posts')
        .insert([insertData])

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      alert('Facebook post saved successfully!')
      window.location.href = '/facebook-posts'
    } catch (error: any) {
      console.error('Error saving Facebook post:', error)
      alert(`Failed to save Facebook post: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/facebook-posts'}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Facebook Posts
          </Button>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>Add Facebook Post</h1>
          <p style={{ color: '#4b5563' }}>Save contact information from Facebook posts or marketplace</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                  Quick Parse - Paste Facebook Post Text
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste the entire Facebook post text here...&#10;&#10;Example:&#10;John Doe&#10;House and Lot for Sale&#10;San Fernando, Pampanga&#10;₱2.5M&#10;200 sqm lot, 150 sqm floor&#10;https://facebook.com/...&#10;Contact: https://m.me/johndoe"
                  className="w-full p-3 border border-gray-300 rounded-md text-sm"
                  style={{ color: '#000000', minHeight: '120px', fontFamily: 'monospace' }}
                />
                <Button 
                  onClick={parseText} 
                  className="mt-2 bg-blue-600 hover:bg-blue-700"
                  disabled={!pasteText.trim()}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Parse Text
                </Button>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-4" style={{ color: '#000000' }}>Parsed Fields (Edit as needed)</h3>
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
                  Facebook Post/Marketplace URL
                </label>
                <Input
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/..."
                  style={{ color: '#000000' }}
                />
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                  Paste the URL from Facebook post or marketplace listing
                </p>
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
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                  Direct messenger link to contact the owner
                </p>
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
                  placeholder="Enter price (e.g., ₱2,500,000)"
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

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Facebook Post'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/facebook-posts'} 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
