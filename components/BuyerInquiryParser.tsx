'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { UserSearch, X, ChevronDown, ChevronUp, MapPin, DollarSign, Maximize, Home, BedDouble, Tag } from 'lucide-react'

// ── Shared query parser (mirrors ChatWidget logic) ───────────────────────────

interface ParsedQuery {
  location?: string
  minLotArea?: number
  maxLotArea?: number
  minFloorArea?: number
  maxFloorArea?: number
  minPrice?: number
  maxPrice?: number
  propertyType?: string
  bedrooms?: number
}

function parsePropertyQuery(input: string): ParsedQuery {
  const q = input.toLowerCase()
  const result: ParsedQuery = {}

  // Lot area
  const lotRange  = q.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*sqm?\s*lot/)
  const lotLabel  = q.match(/(?:lot\s*area|la)[:\s]*(\d+(?:\.\d+)?)\s*sqm?/)
  const lotInline = q.match(/(\d+(?:\.\d+)?)\s*sqm?\s*lot/)
  const lotMin    = q.match(/(?:at\s*least|min(?:imum)?)\s*(\d+(?:\.\d+)?)\s*sqm/)
  const lotMax    = q.match(/(?:at\s*most|max(?:imum)?|under|below)\s*(\d+(?:\.\d+)?)\s*sqm/)
  if (lotRange)       { result.minLotArea = parseFloat(lotRange[1]);  result.maxLotArea = parseFloat(lotRange[2]) }
  else if (lotLabel)  { const v = parseFloat(lotLabel[1]);  result.minLotArea = v * 0.85; result.maxLotArea = v * 1.15 }
  else if (lotInline) { const v = parseFloat(lotInline[1]); result.minLotArea = v * 0.85; result.maxLotArea = v * 1.15 }
  else if (lotMin)    { result.minLotArea = parseFloat(lotMin[1]) }
  else if (lotMax)    { result.maxLotArea = parseFloat(lotMax[1]) }

  // Floor area
  const floorRange  = q.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*sqm?\s*floor/)
  const floorLabel  = q.match(/floor\s*area\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*sqm?/)
  const floorInline = q.match(/(\d+(?:\.\d+)?)\s*sqm?\s*floor/)
  if (floorRange)       { result.minFloorArea = parseFloat(floorRange[1]); result.maxFloorArea = parseFloat(floorRange[2]) }
  else if (floorLabel)  { const v = parseFloat(floorLabel[1]); result.minFloorArea = v * 0.85; result.maxFloorArea = v * 1.15 }
  else if (floorInline) { const v = parseFloat(floorInline[1]); result.minFloorArea = v * 0.85; result.maxFloorArea = v * 1.15 }

  // Price
  const priceRange  = q.match(/(\d+(?:\.\d+)?)\s*m(?:illion)?\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*m(?:illion)?/)
  const priceUnder  = q.match(/(?:under|below|max(?:imum)?(?:\s*(?:price|budget))?|budget\s*(?:of)?)\s*(\d+(?:\.\d+)?)\s*m(?:illion)?/)
  const priceAbove  = q.match(/(?:above|over|min(?:imum)?(?:\s*price)?)\s*(\d+(?:\.\d+)?)\s*m(?:illion)?/)
  const priceSingle = q.match(/(\d+(?:\.\d+)?)\s*m(?:illion)?/)
  if (priceRange)       { result.minPrice = parseFloat(priceRange[1]) * 1e6;  result.maxPrice = parseFloat(priceRange[2]) * 1e6 }
  else if (priceUnder)  { result.maxPrice = parseFloat(priceUnder[1]) * 1e6 }
  else if (priceAbove)  { result.minPrice = parseFloat(priceAbove[1]) * 1e6 }
  else if (priceSingle && !result.minLotArea && !result.maxLotArea) {
    const v = parseFloat(priceSingle[1])
    result.minPrice = v * 1e6 * 0.8
    result.maxPrice = v * 1e6 * 1.2
  }

  // Bedrooms
  const bedMatch = q.match(/(\d+)\s*(?:br|bed(?:room)?s?)/)
  if (bedMatch) result.bedrooms = parseInt(bedMatch[1])

  // Property type
  if (q.includes('condo'))                                                         result.propertyType = 'condo'
  else if (q.includes('house and lot') || q.includes('h&l') || q.includes('h & l')) result.propertyType = 'house and lot'
  else if (q.includes('lot only'))                                                  result.propertyType = 'lot'
  else if (q.includes('townhouse'))                                                 result.propertyType = 'townhouse'
  else if (q.includes('house'))                                                     result.propertyType = 'house'
  else if (q.includes('commercial'))                                                result.propertyType = 'commercial'

  // Location — explicit "near / in / at" first, then fallback strip
  const nearMatch = input.match(/(?:near|in|at|around|close\s*to|beside|along)\s+([A-Za-z][A-Za-z\s]+?)(?:,|$|\d)/i)
  if (nearMatch) {
    result.location = nearMatch[1].trim()
  } else {
    let loc = input
      .replace(/\d+(?:\.\d+)?\s*sqm?\s*(?:lot\s*area|floor\s*area|lot|floor)?/gi, '')
      .replace(/\d+(?:\.\d+)?\s*m(?:illion)?\b/gi, '')
      .replace(/\d+\s*(?:br|bed(?:room)?s?)/gi, '')
      .replace(/(?:near|in|at|around|close\s*to|beside|along|under|below|above|over|budget|minimum|maximum|min|max|at\s*least|at\s*most)/gi, '')
      .replace(/(?:house\s*and\s*lot|lot\s*only|townhouse|condo|commercial|house|lot|floor\s*area|lot\s*area)/gi, '')
      .replace(/[,;.]/g, ' ').replace(/\s+/g, ' ').trim()
    if (loc.length > 1) result.location = loc
  }

  return result
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(price: any) {
  if (!price) return 'Price not specified'
  const n = parseFloat(String(price).replace(/[^\d.]/g, '')) || 0
  if (n >= 1e6) return `₱${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `₱${(n / 1e3).toFixed(0)}K`
  return `₱${n.toLocaleString()}`
}

function getLotNum(prop: any) {
  const raw = String(prop['Lot Area'] || prop['Lot Area sqm'] || prop['LA'] || prop.LotArea || '')
    .replace(/[^\d.]/g, '').replace(/\.+/g, '.')
  return raw && !isNaN(parseFloat(raw)) && parseFloat(raw) > 0 ? raw : ''
}

function getFloorNum(prop: any) {
  const raw = String(prop['Floor Area'] || prop['Floor Area sqm'] || prop.FloorArea || '')
    .replace(/[^\d.]/g, '').replace(/\.+/g, '.')
  return raw && !isNaN(parseFloat(raw)) && parseFloat(raw) > 0 ? raw : ''
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  allProperties: any[]   // full dataset passed from dashboard
}

export default function BuyerInquiryParser({ allProperties }: Props) {
  const [open, setOpen] = useState(false)
  const [inquiry, setInquiry] = useState('')
  const [parsed, setParsed] = useState<ParsedQuery | null>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [searched, setSearched] = useState(false)

  const handleParse = () => {
    if (!inquiry.trim()) return
    const q = parsePropertyQuery(inquiry)
    setParsed(q)

    const results = allProperties.filter(prop => {
      if (q.location) {
        const loc = q.location.toLowerCase()
        if (!(prop.Location || prop.Address || '').toLowerCase().includes(loc)) return false
      }
      const lotRaw  = parseFloat(String(prop['Lot Area'] || prop['Lot Area sqm'] || prop['LA'] || prop.LotArea || '0').replace(/[^\d.]/g, '')) || 0
      const floorRaw = parseFloat(String(prop['Floor Area'] || prop['Floor Area sqm'] || prop.FloorArea || '0').replace(/[^\d.]/g, '')) || 0
      const propPrice = parseFloat(String(prop['Listing Price'] || prop.ListingPrice || prop.Price || '0').replace(/[^\d.]/g, '')) || 0

      if (q.minLotArea  && lotRaw > 0   && lotRaw < q.minLotArea)   return false
      if (q.maxLotArea  && lotRaw > 0   && lotRaw > q.maxLotArea)   return false
      if (q.minFloorArea && floorRaw > 0 && floorRaw < q.minFloorArea) return false
      if (q.maxFloorArea && floorRaw > 0 && floorRaw > q.maxFloorArea) return false
      if (q.minPrice && propPrice < q.minPrice) return false
      if (q.maxPrice && propPrice > q.maxPrice) return false
      if (q.bedrooms) {
        const beds = parseInt(String(prop.Bedrooms || prop['No. of Bedrooms'] || '0').replace(/[^\d]/g, '')) || 0
        if (beds > 0 && beds !== q.bedrooms) return false
      }
      if (q.propertyType) {
        const t = (prop['Property Type'] || prop.PropertyType || prop.Type || '').toLowerCase()
        if (t && !t.includes(q.propertyType)) return false
      }
      return true
    })

    setMatches(results)
    setSearched(true)
  }

  const handleClear = () => {
    setInquiry('')
    setParsed(null)
    setMatches([])
    setSearched(false)
  }

  return (
    <Card className="mb-6 border-purple-200">
      {/* Header — always visible, toggle body */}
      <CardHeader
        className="cursor-pointer select-none py-4 px-6"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserSearch className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-base text-purple-800">Buyer Inquiry Parser</CardTitle>
            <span className="text-xs text-gray-500 font-normal">Paste a buyer's message to find matching listings</span>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4 pt-0">
          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buyer's message (from Messenger, Viber, SMS, etc.)
            </label>
            <textarea
              value={inquiry}
              onChange={e => setInquiry(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md text-sm text-black resize-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
              placeholder={`Paste the buyer's inquiry here. Examples:\n"Hi, looking for house and lot near Clark, budget 3M to 5M"\n"Maghanap ako ng 3 bedroom, San Fernando, around 4M"\n"lot only mabalacat 100 sqm, 1M to 2M"`}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleParse}
              disabled={!inquiry.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <UserSearch className="w-4 h-4 mr-2" />
              Find Matches
            </Button>
            {searched && (
              <Button variant="outline" onClick={handleClear} size="sm">
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          {/* Parsed summary */}
          {parsed && searched && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Detected Requirements</p>
              <div className="flex flex-wrap gap-2">
                {parsed.location && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 gap-1">
                    <MapPin className="w-3 h-3" /> {parsed.location}
                  </Badge>
                )}
                {(parsed.minPrice || parsed.maxPrice) && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
                    <DollarSign className="w-3 h-3" />
                    {parsed.minPrice && parsed.maxPrice
                      ? `₱${(parsed.minPrice/1e6).toFixed(1)}M – ₱${(parsed.maxPrice/1e6).toFixed(1)}M`
                      : parsed.maxPrice
                      ? `Under ₱${(parsed.maxPrice/1e6).toFixed(1)}M`
                      : `Above ₱${(parsed.minPrice!/1e6).toFixed(1)}M`}
                  </Badge>
                )}
                {(parsed.minLotArea || parsed.maxLotArea) && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
                    <Maximize className="w-3 h-3" />
                    {parsed.minLotArea && parsed.maxLotArea
                      ? `~${Math.round((parsed.minLotArea + parsed.maxLotArea) / 2)} sqm lot`
                      : parsed.minLotArea
                      ? `≥${parsed.minLotArea} sqm lot`
                      : `≤${parsed.maxLotArea} sqm lot`}
                  </Badge>
                )}
                {(parsed.minFloorArea || parsed.maxFloorArea) && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 gap-1">
                    <Home className="w-3 h-3" />
                    {parsed.minFloorArea && parsed.maxFloorArea
                      ? `~${Math.round((parsed.minFloorArea + parsed.maxFloorArea) / 2)} sqm floor`
                      : parsed.minFloorArea
                      ? `≥${parsed.minFloorArea} sqm floor`
                      : `≤${parsed.maxFloorArea} sqm floor`}
                  </Badge>
                )}
                {parsed.bedrooms && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1">
                    <BedDouble className="w-3 h-3" /> {parsed.bedrooms} BR
                  </Badge>
                )}
                {parsed.propertyType && (
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200 gap-1">
                    <Tag className="w-3 h-3" /> {parsed.propertyType}
                  </Badge>
                )}
                {!parsed.location && !parsed.minPrice && !parsed.maxPrice &&
                 !parsed.minLotArea && !parsed.maxLotArea && !parsed.minFloorArea &&
                 !parsed.maxFloorArea && !parsed.bedrooms && !parsed.propertyType && (
                  <span className="text-xs text-gray-500 italic">No specific filters detected — showing all properties</span>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {searched && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                {matches.length > 0
                  ? `✅ ${matches.length} matching propert${matches.length === 1 ? 'y' : 'ies'} found`
                  : '❌ No matching properties found — try adjusting the criteria'}
              </p>

              {matches.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {matches.map(prop => {
                    const id = prop['Property ID']
                    const displayId = id > 2 ? id - 1 : id
                    const lot   = getLotNum(prop)
                    const floor = getFloorNum(prop)
                    return (
                      <div
                        key={id}
                        className="border border-purple-100 rounded-lg p-3 bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-semibold text-purple-700">#{displayId}</span>
                          <Badge
                            variant={prop.Status?.toLowerCase() === 'active' ? 'success' : 'secondary'}
                            className="text-xs"
                          >
                            {prop.Status || 'Draft'}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {prop.Village ? `${prop.Village}, ` : ''}{prop.Location || '—'}
                        </p>
                        <p className="text-base font-bold text-green-600 mt-1">
                          {fmtPrice(prop['Listing Price'] || prop.ListingPrice || prop.Price)}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600">
                          {lot   && <span className="flex items-center gap-1"><Maximize className="w-3 h-3" />{lot} sqm lot</span>}
                          {floor && <span className="flex items-center gap-1"><Home className="w-3 h-3" />{floor} sqm floor</span>}
                        </div>
                        <a
                          href={`/properties/${displayId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block text-xs text-blue-600 hover:underline"
                        >
                          View details →
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
