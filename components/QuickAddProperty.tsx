'use client'

import React, { useState } from 'react'
import { databases, DATABASE_ID } from '@/lib/appwrite/client'
import { ID, Query } from 'appwrite'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { X } from 'lucide-react'

const COL = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_LISTINGS!

interface ParsedProperty {
  title: string
  location: string
  village: string
  price: string
  lotArea: string
  floorArea: string
  bedrooms: string
  bathrooms: string
  description: string
  type: string
  listingMode: 'For Sale' | 'For Rent'
  photoUrl: string
  facebookUrl: string
  mop: string
}

function parsePropertyText(text: string): ParsedProperty | null {
  try {
    text = text.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    const titleMatch = text.match(/FOR\s*(?:SALE|RENT)[‼️!]*\s*[✨]*\s*(.+?)(?:\n|📍)/i)
    const title = titleMatch ? titleMatch[1].trim() : text.split('\n').filter(l => l.trim())[0]?.trim() || ''
    const locationMatch = text.match(/📍\s*(.+?)(?:\n|👉)/i)
    const location = locationMatch ? locationMatch[1].trim() : ''
    const villageMatch = text.match(/Village[:\s]+(.+?)(?:\n|,)/i)
    const village = villageMatch ? villageMatch[1].trim() : ''
    const priceMatch = text.match(/₱([\d.,]+[MmKk]?)/i)
    const price = priceMatch ? priceMatch[1].trim() : ''
    const totalLotMatch = text.match(/Total Lot Area[:\s]*([\d,]+)\s*sqm/i)
    const lotAreaMatch = text.match(/Lot Area[:\s]*([\d,]+)\s*sqm/i)
    const lotArea = (totalLotMatch || lotAreaMatch)?.[1]?.replace(/,/g, '') || ''
    const houseLotMatch = text.match(/House Lot Area[:\s]*(?:approx\.?\s*)?([\d,]+)\s*sqm/i)
    const floorAreaMatch = text.match(/Floor Area[:\s]*([\d,]+)\s*sqm/i)
    const floorArea = (houseLotMatch || floorAreaMatch)?.[1]?.replace(/,/g, '') || ''
    const bedroomMatch = text.match(/(\d+)\s*Bedroom/i)
    const bathroomMatch = text.match(/(\d+)\s*Toilet\s*&\s*Bath/i)
    const fbMatch = text.match(/(https?:\/\/(?:www\.|m\.)?facebook\.com\/(?:share\/p\/|[^\s]+)|https?:\/\/fb\.com\/[^\s]+)/i)
    const photoMatch = text.match(/(https?:\/\/[^\s]+(?:photos\.google\.com|photos\.app\.goo\.gl|drive\.google\.com|\.jpg|\.jpeg|\.png|\.gif|\.webp)[^\s]*)/i)
    let photoUrl = photoMatch?.[1]?.trim() || ''
    if (photoUrl.includes('facebook.com')) photoUrl = ''
    let type = 'Residential'
    if (/lot only/i.test(text)) type = 'Lot'
    else if (/commercial/i.test(text)) type = 'Commercial'
    const listingMode: 'For Sale' | 'For Rent' = /for\s*rent/i.test(text) ? 'For Rent' : 'For Sale'
    return {
      title, location, village, price, lotArea, floorArea,
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

async function getNextPropertyId(): Promise<number> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COL, [
      Query.orderDesc('property_id'),
      Query.limit(1),
      Query.select(['property_id']),
    ])
    const last = res.documents[0] as any
    return (Number(last?.property_id) || 0) + 1
  } catch { return Date.now() }
}

function toDbRow(p: ParsedProperty, propertyId: number) {
  const isRent = p.listingMode === 'For Rent'
  return {
    property_id: propertyId,
    Title: p.title || '',
    Location: p.location || '',
    Village: p.village || '',
    Listing_Price: toNumber(p.price || '0'),
    Lot_Area_sqm: p.lotArea ? Number(p.lotArea) : null,
    Floor_Area_sqm: p.floorArea ? Number(p.floorArea) : null,
    Bedroom: p.bedrooms ? Number(p.bedrooms) : null,
    Bathroom: p.bathrooms ? Number(p.bathrooms) : null,
    Preview_Photo: typeof p.photoUrl === "string" ? p.photoUrl : "",
    Facebook_Video_URL: p.facebookUrl || null,
    Listing_Mode: p.listingMode,
    Financing_options: p.mop || 'Bank Financing',
    Notes: isRent ? `[FOR RENT]\n${p.description}` : p.description,
    Type: p.type || 'Residential',
    Status: 'active',
    ...(!isRent && { CGT: 'Seller', Transfer_Title: 'Buyer' }),
  }
}

const FIELDS: [string, keyof ParsedProperty][] = [
  ['Title', 'title'], ['Location', 'location'], ['Village', 'village'],
  ['Price', 'price'], ['Lot Area (sqm)', 'lotArea'], ['Floor Area (sqm)', 'floorArea'],
  ['Bedrooms', 'bedrooms'], ['Bathrooms', 'bathrooms'],
]

export default function QuickAddProperty({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [pastedText, setPastedText] = useState('')
  const [parsed, setParsed] = useState<ParsedProperty | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleParse = () => {
    const p = parsePropertyText(pastedText)
    if (p) { setParsed(p); setError('') }
    else setError('Could not parse. Check the format and try again.')
  }

  const handleSave = async () => {
    if (!parsed) return
    setSaving(true)
    setError('')
    try {
      const propertyId = await getNextPropertyId()
      await databases.createDocument(DATABASE_ID, COL, ID.unique(), toDbRow(parsed, propertyId))
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err?.message ?? String(err))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[92vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b shrink-0 py-3 px-5">
          <CardTitle className="text-base">Quick Add Property</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {!parsed ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Paste property listing text:</label>
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Paste the formatted property text here…"
                className="w-full h-56 p-3 border border-gray-300 rounded-lg text-sm text-black resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <Button onClick={handleParse} disabled={!pastedText.trim()} className="w-full">
                Parse Details →
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FIELDS.map(([label, field]) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <input
                      type="text"
                      value={(parsed as any)[field] || ''}
                      onChange={e => setParsed({ ...parsed, [field]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                  <select value={parsed.type} onChange={e => setParsed({ ...parsed, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black">
                    <option>Residential</option><option>Lot</option><option>Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Mode of Payment</label>
                  <select value={parsed.mop} onChange={e => setParsed({ ...parsed, mop: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black">
                    <option>Cash</option><option>Bank Financing</option><option>Pagibig</option><option>Inhouse</option><option>Others</option>
                  </select>
                </div>
              </div>

              {/* Listing mode toggle */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Listing Mode</label>
                <div className="flex gap-2">
                  {(['For Sale', 'For Rent'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setParsed({ ...parsed, listingMode: m })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${parsed.listingMode === m ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'}`}
                    >
                      {m === 'For Sale' ? '🏷️' : '🔑'} {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo / FB links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Photo URL (optional)</label>
                  <input type="text" value={parsed.photoUrl} onChange={e => setParsed({ ...parsed, photoUrl: e.target.value })} placeholder="https://…" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Facebook URL (optional)</label>
                  <input type="text" value={parsed.facebookUrl} onChange={e => setParsed({ ...parsed, facebookUrl: e.target.value })} placeholder="https://facebook.com/…" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea value={parsed.description} onChange={e => setParsed({ ...parsed, description: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1 h-11">
                  {saving ? 'Saving…' : '✓ Save Property'}
                </Button>
                <Button variant="outline" onClick={() => setParsed(null)} className="flex-1 h-11">
                  ← Edit Text
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
