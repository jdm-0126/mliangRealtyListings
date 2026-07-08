'use client'

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
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

function parsePropertyText(text: string): ParsedProperty | null {
  try {
    text = text.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    let title = ''
    const titleMatch = text.match(/FOR\s*(?:SALE|RENT)[‼️!]*\s*[✨]*\s*(.+?)(?:\n|📍)/i)
    if (titleMatch) title = titleMatch[1].trim()
    else title = text.split('\n').filter(l => l.trim())[0]?.trim() || ''
    const locationMatch = text.match(/📍\s*(.+?)(?:\n|👉)/i)
    const location = locationMatch ? locationMatch[1].trim() : ''
    const priceMatch = text.match(/₱([\d.,]+[MmKk]?)/i)
    const price = priceMatch ? priceMatch[1].trim() : ''
    let lotArea = ''
    const totalLotMatch = text.match(/Total Lot Area[:\s]*([\d,]+)\s*sqm/i)
    if (totalLotMatch) lotArea = totalLotMatch[1].replace(/,/g, '')
    else { const m = text.match(/Lot Area[:\s]*([\d,]+)\s*sqm/i); lotArea = m ? m[1].replace(/,/g, '') : '' }
    let floorArea = ''
    const houseLotMatch = text.match(/House Lot Area[:\s]*(?:approx\.?\s*)?([\d,]+)\s*sqm/i)
    if (houseLotMatch) floorArea = houseLotMatch[1].replace(/,/g, '')
    else { const m = text.match(/Floor Area[:\s]*([\d,]+)\s*sqm/i); floorArea = m ? m[1].replace(/,/g, '') : '' }
    const bedroomMatch = text.match(/(\d+)\s*Bedroom/i)
    const bathroomMatch = text.match(/(\d+)\s*Toilet\s*&\s*Bath/i)
    const fbMatch = text.match(/(https?:\/\/(?:www\.|m\.)?facebook\.com\/(?:share\/p\/|[^\s]+)|https?:\/\/fb\.com\/[^\s]+)/i)
    const photoMatch = text.match(/(https?:\/\/[^\s]+(?:photos\.google\.com|photos\.app\.goo\.gl|drive\.google\.com|\.jpg|\.jpeg|\.png|\.gif|\.webp)[^\s]*)/i)
    let photoUrl = photoMatch ? photoMatch[1].trim() : ''
    if (photoUrl?.includes('facebook.com')) photoUrl = ''
    let type = 'Residential'
    if (/lot only/i.test(text)) type = 'Lot'
    else if (/commercial/i.test(text)) type = 'Commercial'
    const listingMode: 'For Sale' | 'For Rent' = /for\s*rent/i.test(text) ? 'For Rent' : 'For Sale'
    return {
      title, location, price, lotArea, floorArea,
      bedrooms: bedroomMatch?.[1] || '',
      bathrooms: bathroomMatch?.[1] || '',
      description: text.trim(), type, listingMode,
      photoUrl, facebookUrl: fbMatch?.[1]?.trim() || '',
      mop: 'Bank Financing',
    }
  } catch { return null }
}

function toNumber(price: string): number {
  const s = (price || '').replace(/,/g, '').trim()
  if (/m$/i.test(s)) return parseFloat(s) * 1_000_000
  if (/k$/i.test(s)) return parseFloat(s) * 1_000
  return parseFloat(s.replace(/[^\d.]/g, '')) || 0
}

function toDbRow(p: ParsedProperty, tenantId: string) {
  const listingMode = p.listingMode === 'For Rent' ? 'For Rent' : 'For Sale'
  return {
    tenant_id: tenantId,
    Title: p.title || '',
    Location: p.location || '',
    'Listing Price': toNumber(p.price || '0'),
    'Lot Area sqm': p.lotArea || '',
    'Floor Area sqm': p.floorArea || '',
    Bedroom: p.bedrooms || '',
    Photos: p.photoUrl || '',
    'FB Link': p.facebookUrl || '',
    'Listing Mode': listingMode,
    'Financing options': p.mop || 'Bank Financing',
    Notes: listingMode === 'For Rent' ? `[FOR RENT]\n${p.description}` : p.description,
    Type: p.type || 'Residential',
    Status: 'Active',
    ...(listingMode !== 'For Rent' && { CGT: 'Seller', 'Transfer Title': 'Buyer' }),
  }
}

export default function QuickAddProperty({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [pastedText, setPastedText] = useState('')
  const [parsedData, setParsedData] = useState<ParsedProperty | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!parsedData) return
    setLoading(true)
    try {
      const { getTenantScopedClient } = await import('@/lib/supabase/browserTenantClient')
      const { supabase, tenantId, listingsTable } = await getTenantScopedClient()
      const { error } = await supabase.from(listingsTable).insert([toDbRow(parsedData, tenantId)])
      if (error) { alert('Error: ' + error.message); return }
      alert('Property added successfully!')
      onSuccess(); onClose()
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[92vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b shrink-0">
          <CardTitle>Add Property</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {!parsedData ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>Paste Property Details:</label>
                  <textarea
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    placeholder="Paste the formatted property text here..."
                    className="w-full h-64 p-3 border border-gray-300 rounded-md"
                    style={{ color: '#000000' }}
                  />
                </div>
                <Button onClick={() => { const p = parsePropertyText(pastedText); p ? setParsedData(p) : alert('Could not parse. Check format.') }} className="w-full">
                  Parse Details
                </Button>
              </>
            ) : (
              <Card className="border-2 border-blue-200">
                <CardHeader className="bg-blue-50 border-b border-blue-200">
                  <h3 className="font-semibold text-lg" style={{ color: '#000000' }}>Parsed Property Details</h3>
                  <p className="text-sm text-gray-600">Review and edit before saving</p>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {([
                      ['Title', 'title'], ['Location', 'location'], ['Price', 'price'],
                      ['Lot Area (sqm)', 'lotArea'], ['Floor Area (sqm)', 'floorArea'],
                      ['Bedrooms', 'bedrooms'], ['Bathrooms', 'bathrooms'],
                    ] as [string, keyof ParsedProperty][]).map(([label, field]) => (
                      <div key={field}>
                        <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>{label}:</label>
                        <input type="text" value={(parsedData as any)[field] || ''} onChange={e => setParsedData({ ...parsedData, [field]: e.target.value })} className="w-full p-2 border border-gray-300 rounded" style={{ color: '#000000' }} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Type:</label>
                      <select value={parsedData.type} onChange={e => setParsedData({ ...parsedData, type: e.target.value })} className="w-full p-2 border border-gray-300 rounded" style={{ color: '#000000' }}>
                        <option>Residential</option><option>Lot</option><option>Commercial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Listing Mode:</label>
                      <div className="flex gap-3">
                        {(['For Sale', 'For Rent'] as const).map(m => (
                          <label key={m} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded border cursor-pointer ${parsedData.listingMode === m ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'}`}>
                            <input type="radio" name="listingMode" value={m} checked={parsedData.listingMode === m} onChange={() => setParsedData({ ...parsedData, listingMode: m })} className="hidden" />
                            {m === 'For Sale' ? '🏷️' : '🔑'} {m}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Mode of Payment:</label>
                      <select value={parsedData.mop || 'Bank Financing'} onChange={e => setParsedData({ ...parsedData, mop: e.target.value })} className="w-full p-2 border border-gray-300 rounded" style={{ color: '#000000' }}>
                        <option>Cash</option><option>Bank Financing</option><option>Pagibig</option><option>Inhouse</option><option>Others</option>
                      </select>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: '#4b5563' }}>Description: <span className="text-red-500">*</span></label>
                    <textarea value={parsedData.description} onChange={e => setParsedData({ ...parsedData, description: e.target.value })} className="w-full p-3 border border-gray-300 rounded h-32" style={{ color: '#000000' }} />
                  </div>
                  <div className="border-t pt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>Google Photos Link (Optional)</label>
                      <input type="text" value={parsedData.photoUrl || ''} onChange={e => setParsedData({ ...parsedData, photoUrl: e.target.value })} className="w-full p-2 border border-gray-300 rounded" style={{ color: '#000000' }} placeholder="https://photos.google.com/..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: '#4b5563' }}>FB Link (Optional)</label>
                      <input type="text" value={parsedData.facebookUrl || ''} onChange={e => setParsedData({ ...parsedData, facebookUrl: e.target.value })} className="w-full p-2 border border-gray-300 rounded" style={{ color: '#000000' }} placeholder="https://facebook.com/..." />
                    </div>
                  </div>
                </CardContent>
                <div className="border-t bg-gray-50 p-6 flex gap-3">
                  <Button onClick={handleSave} disabled={loading} className="flex-1 h-12 text-base">{loading ? 'Saving...' : '✓ Save Property'}</Button>
                  <Button variant="outline" onClick={() => setParsedData(null)} className="flex-1 h-12 text-base">← Edit Text</Button>
                </div>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
