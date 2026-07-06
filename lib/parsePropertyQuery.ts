/**
 * Shared property query parser used by both ChatWidget and ModernDashboard.
 * Parses free-text queries like "110 sqm lot, near Clark, under 5M".
 */

export interface ParsedQuery {
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

export function parsePropertyQuery(input: string): ParsedQuery {
  const q = input.toLowerCase()
  const result: ParsedQuery = {}

  // --- Lot area (sqm) ---
  const lotRange  = q.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*sqm?\s*lot/)
  const lotLabel  = q.match(/lot\s*area\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*sqm?/)
  const lotInline = q.match(/(\d+(?:\.\d+)?)\s*sqm?\s*lot/)
  const lotMin    = q.match(/(?:at\s*least|min(?:imum)?)\s*(\d+(?:\.\d+)?)\s*sqm/)
  const lotMax    = q.match(/(?:at\s*most|max(?:imum)?|under|below)\s*(\d+(?:\.\d+)?)\s*sqm/)

  if (lotRange) {
    result.minLotArea = parseFloat(lotRange[1])
    result.maxLotArea = parseFloat(lotRange[2])
  } else if (lotLabel) {
    const v = parseFloat(lotLabel[1])
    result.minLotArea = v * 0.85
    result.maxLotArea = v * 1.15
  } else if (lotInline) {
    const v = parseFloat(lotInline[1])
    result.minLotArea = v * 0.85
    result.maxLotArea = v * 1.15
  } else if (lotMin) {
    result.minLotArea = parseFloat(lotMin[1])
  } else if (lotMax) {
    result.maxLotArea = parseFloat(lotMax[1])
  }

  // --- Floor area (sqm) ---
  const floorRange  = q.match(/(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*sqm?\s*floor/)
  const floorLabel  = q.match(/floor\s*area\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*sqm?/)
  const floorInline = q.match(/(\d+(?:\.\d+)?)\s*sqm?\s*floor/)

  if (floorRange) {
    result.minFloorArea = parseFloat(floorRange[1])
    result.maxFloorArea = parseFloat(floorRange[2])
  } else if (floorLabel) {
    const v = parseFloat(floorLabel[1])
    result.minFloorArea = v * 0.85
    result.maxFloorArea = v * 1.15
  } else if (floorInline) {
    const v = parseFloat(floorInline[1])
    result.minFloorArea = v * 0.85
    result.maxFloorArea = v * 1.15
  }

  // --- Price ---
  const priceRange  = q.match(/(\d+(?:\.\d+)?)\s*m(?:illion)?\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*m(?:illion)?/)
  const priceUnder  = q.match(/(?:under|below|max(?:imum)?(?:\s*(?:price|budget))?|budget\s*(?:of)?)\s*(\d+(?:\.\d+)?)\s*m(?:illion)?/)
  const priceAbove  = q.match(/(?:above|over|min(?:imum)?(?:\s*price)?)\s*(\d+(?:\.\d+)?)\s*m(?:illion)?/)
  const priceSingle = q.match(/(\d+(?:\.\d+)?)\s*m(?:illion)?/)

  if (priceRange) {
    result.minPrice = parseFloat(priceRange[1]) * 1_000_000
    result.maxPrice = parseFloat(priceRange[2]) * 1_000_000
  } else if (priceUnder) {
    result.maxPrice = parseFloat(priceUnder[1]) * 1_000_000
  } else if (priceAbove) {
    result.minPrice = parseFloat(priceAbove[1]) * 1_000_000
  } else if (priceSingle && !result.minLotArea && !result.maxLotArea) {
    const v = parseFloat(priceSingle[1])
    result.minPrice = v * 1_000_000 * 0.8
    result.maxPrice = v * 1_000_000 * 1.2
  }

  // --- Bedrooms ---
  const bedMatch = q.match(/(\d+)\s*(?:br|bed(?:room)?s?)/)
  if (bedMatch) result.bedrooms = parseInt(bedMatch[1])

  // --- Property type ---
  if (q.includes('condo')) result.propertyType = 'condo'
  else if (q.includes('house and lot') || q.includes('h&l') || q.includes('h & l')) result.propertyType = 'house and lot'
  else if (q.includes('lot only')) result.propertyType = 'lot'
  else if (q.includes('townhouse')) result.propertyType = 'townhouse'
  else if (q.includes('house')) result.propertyType = 'house'
  else if (q.includes('commercial')) result.propertyType = 'commercial'

  // --- Location ---
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
      .replace(/[,;.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (loc.length > 1) result.location = loc
  }

  return result
}

/**
 * Filter a properties array using a ParsedQuery.
 * Matches the same logic as ChatWidget's filterProperties.
 */
export function filterPropertiesByQuery(properties: any[], parsed: ParsedQuery): any[] {
  return properties.filter(prop => {
    // Location
    if (parsed.location) {
      const loc = parsed.location.toLowerCase()
      const propLoc = (prop.Location || prop.Address || prop.Village || '').toLowerCase()
      if (!propLoc.includes(loc)) return false
    }
    // Lot area
    const lotRaw = parseFloat(String(
      prop['Lot Area'] || prop['Lot Area sqm'] || prop['LA'] || prop.LotArea || '0'
    ).replace(/[^\d.]/g, '')) || 0
    if (parsed.minLotArea && lotRaw > 0 && lotRaw < parsed.minLotArea) return false
    if (parsed.maxLotArea && lotRaw > 0 && lotRaw > parsed.maxLotArea) return false
    // Floor area
    const floorRaw = parseFloat(String(
      prop['Floor Area'] || prop['Floor Area sqm'] || prop.FloorArea || '0'
    ).replace(/[^\d.]/g, '')) || 0
    if (parsed.minFloorArea && floorRaw > 0 && floorRaw < parsed.minFloorArea) return false
    if (parsed.maxFloorArea && floorRaw > 0 && floorRaw > parsed.maxFloorArea) return false
    // Price
    const propPrice = parseFloat(String(
      prop['Listing Price'] || prop.ListingPrice || prop.Price || '0'
    ).replace(/[^\d.]/g, '')) || 0
    if (parsed.minPrice && propPrice < parsed.minPrice) return false
    if (parsed.maxPrice && propPrice > parsed.maxPrice) return false
    // Bedrooms
    if (parsed.bedrooms) {
      const propBeds = parseInt(String(
        prop.Bedrooms || prop['No. of Bedrooms'] || '0'
      ).replace(/[^\d]/g, '')) || 0
      if (propBeds > 0 && propBeds !== parsed.bedrooms) return false
    }
    // Property type
    if (parsed.propertyType) {
      const propType = (prop['Property Type'] || prop.PropertyType || prop.Type || '').toLowerCase()
      if (propType && !propType.includes(parsed.propertyType)) return false
    }
    return true
  })
}
