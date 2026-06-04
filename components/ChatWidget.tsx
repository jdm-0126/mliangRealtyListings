'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { supabase } from '@/app/lib/supabaseClient.js'

type ConversationType = 'buying' | 'selling' | 'renting' | 'investing' | 'general' | 'looking'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface PropertySearch {
  step: 'freeform' | 'complete'
}

// Parsed filters from a natural language property query
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

// Parse a free-text query like "110 sqm lot area, near Clark, under 5M"
function parsePropertyQuery(input: string): ParsedQuery {
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
    // Only treat as price if no sqm context already captured this number
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
  // Try explicit "near/in/at/around X"
  const nearMatch = input.match(/(?:near|in|at|around|close\s*to|beside|along)\s+([A-Za-z][A-Za-z\s]+?)(?:,|$|\d)/i)
  if (nearMatch) {
    result.location = nearMatch[1].trim()
  } else {
    // Strip numbers+units and known keyword tokens; remainder is likely location
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

// Real Estate FAQ Knowledge Base
const FAQ_DATABASE: { [key: string]: string } = {
  'buying process': 'The property buying process in the Philippines involves: 1) Due Diligence (verify title at Registry of Deeds), 2) Contract to Sell (if installment), 3) Execute Deed of Absolute Sale (notarized), 4) Pay taxes (CGT 6%, DST 1.5%), 5) Transfer title at Registry of Deeds, 6) Transfer Tax Declaration. Total transaction cost is approximately 8-10% of property value.',
  'how to buy': "To buy property: First, verify the title at the Registry of Deeds. Check for liens, encumbrances, and ensure the seller's name matches. Then execute a notarized Deed of Absolute Sale, pay required taxes (CGT and DST), and transfer the title.",
  'taxes': 'Property transaction taxes include: Capital Gains Tax (CGT) - 6% paid by seller, Documentary Stamp Tax (DST) - 1.5% paid by buyer, Transfer Tax - 0.5-0.75% depending on LGU, Registration Fee - varies, and Notary fees ₱5,000-₱20,000. Total is about 8-10% of property value.',
  'cgt': 'Capital Gains Tax (CGT) is 6% of the selling price or fair market value (whichever is higher). It is typically paid by the SELLER within 30 days of sale.',
  'dst': 'Documentary Stamp Tax (DST) is 1.5% of the selling price or fair market value (whichever is higher). It is typically paid by the BUYER.',
  'documents needed': "Required documents: 1) Original Owner's Duplicate Title, 2) Notarized Deed of Absolute Sale, 3) Certificate Authorizing Registration (CAR) from BIR, 4) Tax Clearance, 5) Transfer tax receipt, 6) Valid IDs of buyer and seller, 7) Marriage certificate (if married), 8) TIN numbers.",
  'financing': 'Property financing options: 1) Bank Financing - 20% down, 80% loan, 6-10% interest, 5-20 years term. 2) Pag-IBIG Financing - Up to ₱6M loan, 5.5-6.5% interest, up to 30 years. 3) In-house Financing - Developer offers installment, terms vary.',
  'bank financing': 'Bank financing typically requires: 20% down payment (equity), 80% loan amount, interest rate 6-10% per year, loan terms 5-20 years. Requirements: proof of income (payslips, ITR), valid IDs, property appraisal, employment certificate. Processing takes 2-4 weeks.',
  'pagibig': 'Pag-IBIG Fund offers affordable housing loans: Maximum ₱6,000,000 loan, interest rate 5.5-6.5% (lower than banks), up to 30 years to pay, requires Pag-IBIG membership (at least 24 monthly contributions). Can finance house and lot, condominium, or lot only.',
  'pag-ibig': 'Pag-IBIG Fund offers affordable housing loans: Maximum ₱6,000,000 loan, interest rate 5.5-6.5% (lower than banks), up to 30 years to pay, requires Pag-IBIG membership (at least 24 monthly contributions). Can finance house and lot, condominium, or lot only.',
  'mortgage': 'A mortgage is a loan from a bank to purchase property. You typically need 20% down payment and can finance 80%. Interest rates range from 6-10% annually. Loan terms usually 5-20 years for banks, up to 30 years for Pag-IBIG.',
  'down payment': 'Down payment requirements: Bank - 20% of property price, Pag-IBIG - 20% for loans over ₱3M, can be as low as 10% for lower amounts, In-house - 10-20% depending on developer. This is your equity in the property.',
  'loan requirements': '1) Valid IDs (2 government-issued), 2) Proof of income (payslips, ITR, bank statements), 3) Employment certificate or business permit, 4) TIN number, 5) Property documents (title, tax declaration), 6) Marriage certificate if married, 7) Proof of billing address.',
  'bank loan': 'Bank housing loans: BDO, BPI, Metrobank, Security Bank offer 80% financing, 6-10% interest rates, 5-20 years terms. Submit: income proof, IDs, employment certificate. Processing 2-4 weeks. Monthly amortization includes principal + interest.',
  'pag-ibig requirements': 'Pag-IBIG requirements: 1) At least 24 monthly contributions, 2) Age 18-65 years old, 3) Proof of income, 4) Valid IDs, 5) Property documents, 6) Marriage certificate if married. Advantages: Lower interest (5.5-6.5%), longer term (30 years), higher loan amount (₱6M).',
  'pag-ibig steps': `📋 **Step-by-Step Pag-IBIG Housing Loan Process:**\n\n**STEP 1 – Check Eligibility**\n• Must be an active Pag-IBIG member\n• At least 24 monthly contributions\n• Age 18–65 years old (not over 70 at loan maturity)\n• No existing Pag-IBIG housing loan in arrears\n\n**STEP 2 – Get Pre-Qualification**\n• Visit any Pag-IBIG Fund branch or go to www.pagibigfund.gov.ph\n• Submit income documents for initial assessment\n• Determine loanable amount based on income & contributions\n\n**STEP 3 – Prepare & Submit Requirements**\n• Housing Loan Application (HLA) form\n• Proof of income (payslips, ITR, Certificate of Employment)\n• 2 valid government-issued IDs\n• Marriage certificate (if married) or birth certificate\n• Property documents (TCT/CCT, tax declaration, lot plan)\n• Contract to Sell or Reservation Agreement from developer\n\n**STEP 4 – Property Appraisal**\n• Pag-IBIG assigns an accredited appraiser\n• Property is inspected and valued\n• Appraisal takes 5–10 business days\n\n**STEP 5 – Loan Evaluation & Approval**\n• Pag-IBIG reviews application and appraisal\n• Credit investigation is conducted\n• Approval notice is sent (usually 3–4 weeks)\n• Approved loan amount and terms are confirmed\n\n**STEP 6 – Loan Disclosure & Signing**\n• Sign the Loan Disclosure Statement\n• Sign the Promissory Note and Mortgage\n• Pay required fees (MRI, fire insurance, processing fee)\n\n**STEP 7 – Release of Loan Proceeds**\n• Pag-IBIG releases funds to seller/developer\n• For completed units: full release\n• For construction: staggered releases per progress\n\n**STEP 8 – Title Transfer & Mortgage Annotation**\n• Buyer/seller pays transfer taxes (CGT, DST, transfer tax)\n• Title is transferred to buyer's name\n• Mortgage is annotated on the new title in favor of Pag-IBIG\n\n**STEP 9 – Start Monthly Amortization**\n• First payment starts 1 month after loan release\n• Pay via salary deduction, over-the-counter, or online\n• Loan term up to 30 years\n\n📞 For assistance, call us at **09393440944**`,
  'pagibig steps': `📋 **Step-by-Step Pag-IBIG Housing Loan Process:**\n\n**STEP 1 – Check Eligibility**\n• Must be an active Pag-IBIG member\n• At least 24 monthly contributions\n• Age 18–65 years old (not over 70 at loan maturity)\n• No existing Pag-IBIG housing loan in arrears\n\n**STEP 2 – Get Pre-Qualification**\n• Visit any Pag-IBIG Fund branch or go to www.pagibigfund.gov.ph\n• Submit income documents for initial assessment\n• Determine loanable amount based on income & contributions\n\n**STEP 3 – Prepare & Submit Requirements**\n• Housing Loan Application (HLA) form\n• Proof of income (payslips, ITR, Certificate of Employment)\n• 2 valid government-issued IDs\n• Marriage certificate (if married) or birth certificate\n• Property documents (TCT/CCT, tax declaration, lot plan)\n• Contract to Sell or Reservation Agreement from developer\n\n**STEP 4 – Property Appraisal**\n• Pag-IBIG assigns an accredited appraiser\n• Property is inspected and valued\n• Appraisal takes 5–10 business days\n\n**STEP 5 – Loan Evaluation & Approval**\n• Pag-IBIG reviews application and appraisal\n• Credit investigation is conducted\n• Approval notice is sent (usually 3–4 weeks)\n• Approved loan amount and terms are confirmed\n\n**STEP 6 – Loan Disclosure & Signing**\n• Sign the Loan Disclosure Statement\n• Sign the Promissory Note and Mortgage\n• Pay required fees (MRI, fire insurance, processing fee)\n\n**STEP 7 – Release of Loan Proceeds**\n• Pag-IBIG releases funds to seller/developer\n• For completed units: full release\n• For construction: staggered releases per progress\n\n**STEP 8 – Title Transfer & Mortgage Annotation**\n• Buyer/seller pays transfer taxes (CGT, DST, transfer tax)\n• Title is transferred to buyer's name\n• Mortgage is annotated on the new title in favor of Pag-IBIG\n\n**STEP 9 – Start Monthly Amortization**\n• First payment starts 1 month after loan release\n• Pay via salary deduction, over-the-counter, or online\n• Loan term up to 30 years\n\n📞 For assistance, call us at **09393440944**`,
  'contact': 'You can contact us at: Phone: 09393440944, Office: S10, 2nd Floor Plaza Cristina Building, Dolores, City of San Fernando, Pampanga. PRC License No. 0019653.',
  'services': 'We offer: Property listings (house and lot, lots, commercial), Property buying assistance, Title verification support, Financing guidance (Bank and Pag-IBIG), Documentation assistance, and Property viewing arrangements.',
}

export default function ChatWidget() {
  // Restore persisted chat state from sessionStorage on mount
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try { return JSON.parse(sessionStorage.getItem('chat_isOpen') || 'false') } catch { return false }
  })
  const [isMinimized] = useState(false)
  const [conversationType, setConversationType] = useState<ConversationType | null>(() => {
    try { return sessionStorage.getItem('chat_conversationType') as ConversationType | null } catch { return null }
  })
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem('chat_messages')
      if (!saved) return []
      return JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
    } catch { return [] }
  })
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [waitingForYesNo, setWaitingForYesNo] = useState<boolean>(() => {
    try { return JSON.parse(sessionStorage.getItem('chat_waitingForYesNo') || 'false') } catch { return false }
  })
  const [waitingForPagibigSteps, setWaitingForPagibigSteps] = useState<boolean>(() => {
    try { return JSON.parse(sessionStorage.getItem('chat_waitingForPagibigSteps') || 'false') } catch { return false }
  })
  const [propertySearch, setPropertySearch] = useState<PropertySearch | null>(() => {
    try {
      const saved = sessionStorage.getItem('chat_propertySearch')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [realProperties, setRealProperties] = useState<any[]>([])
  const [propertiesLoaded, setPropertiesLoaded] = useState(false)
  const [businessName, setBusinessName] = useState('M. Liang Realty')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const conversationTypes: Record<ConversationType, string> = {
    buying: 'Home Buying',
    selling: 'Home Selling',
    renting: 'Rental Properties',
    investing: 'Real Estate Investment',
    general: 'General Questions',
    looking: 'Looking for Property',
  }

  useEffect(() => {
    const savedName = localStorage.getItem('businessName')
    if (savedName) setBusinessName(savedName)
    fetchRealProperties()
  }, [])

  // Persist chat state to sessionStorage so results survive tab switches / new-tab opens
  useEffect(() => { try { sessionStorage.setItem('chat_isOpen', JSON.stringify(isOpen)) } catch {} }, [isOpen])
  useEffect(() => { try { sessionStorage.setItem('chat_conversationType', conversationType ?? '') } catch {} }, [conversationType])
  useEffect(() => { try { sessionStorage.setItem('chat_messages', JSON.stringify(messages)) } catch {} }, [messages])
  useEffect(() => { try { sessionStorage.setItem('chat_waitingForYesNo', JSON.stringify(waitingForYesNo)) } catch {} }, [waitingForYesNo])
  useEffect(() => { try { sessionStorage.setItem('chat_waitingForPagibigSteps', JSON.stringify(waitingForPagibigSteps)) } catch {} }, [waitingForPagibigSteps])
  useEffect(() => { try { sessionStorage.setItem('chat_propertySearch', JSON.stringify(propertySearch)) } catch {} }, [propertySearch])

  const fetchRealProperties = async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase
        .from('mlianglistings')
        .select('*')
        .order('Property ID', { ascending: false })
      if (!error) {
        setRealProperties(data || [])
        setPropertiesLoaded(true)
      }
    } catch (err) {
      console.error('Error fetching properties:', err)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const quickQuestions: Record<string, string[]> = {
    buying: [
      'How to buy property?',
      'What are the taxes?',
      'What documents are needed?',
      'Bank financing',
      'Pag-IBIG financing',
      'Pag-IBIG steps',
      'Contact information',
    ],
    selling: [
      'How to sell property?',
      'What is CGT?',
      'What documents are needed?',
      'Contact information',
    ],
    renting: ['Rental information', 'Contact information'],
    investing: [
      'Investment advice',
      'Bank financing',
      'Pag-IBIG financing',
      'Pag-IBIG steps',
      'Contact information',
    ],
    general: [
      'Services offered',
      'Bank financing',
      'Pag-IBIG financing',
      'Pag-IBIG steps',
      'Contact information',
      'Office location',
    ],
  }

  const handleQuickQuestion = (question: string) => {
    setInputText(question)
    setTimeout(() => handleSend(question), 100)
  }

  const resetChat = () => {
    setConversationType(null)
    setMessages([])
    setWaitingForYesNo(false)
    setWaitingForPagibigSteps(false)
    setPropertySearch(null)
    setInputText('')
    // Clear persisted state
    try {
      sessionStorage.removeItem('chat_conversationType')
      sessionStorage.removeItem('chat_messages')
      sessionStorage.removeItem('chat_waitingForYesNo')
      sessionStorage.removeItem('chat_waitingForPagibigSteps')
      sessionStorage.removeItem('chat_propertySearch')
    } catch {}
  }

  const selectConversationType = (type: ConversationType) => {
    setConversationType(type)
    if (type === 'looking') {
      setPropertySearch({ step: 'freeform' })
      setMessages([{
        id: 1,
        text: `Great! I'll help you find the perfect property. 🏠\n\nJust describe what you're looking for in one message!\n\n**Examples:**\n- "110 sqm lot area, near Clark"\n- "House and lot in San Fernando, under 5M"\n- "3 bedroom, 80 sqm floor area, Mabalacat"\n- "Lot only, Angeles City, 2M to 4M"\n- "Condo near Clark, above 3M"\n\nType your search below:`,
        sender: 'bot',
        timestamp: new Date(),
      }])
    } else {
      setMessages([{
        id: 1,
        text: `Great! I'm here to help with ${conversationTypes[type].toLowerCase()}. What would you like to know?`,
        sender: 'bot',
        timestamp: new Date(),
      }])
    }
  }

  // --- Property filtering ---
  const filterProperties = (parsed: ParsedQuery) => {
    if (!propertiesLoaded || realProperties.length === 0) return []
    return realProperties.filter(prop => {
      // Location
      if (parsed.location) {
        const loc = parsed.location.toLowerCase()
        const propLoc = (prop.Location || prop.Address || '').toLowerCase()
        if (!propLoc.includes(loc)) return false
      }
      // Lot area — handle all known column name variants incl. "LA" abbreviation
      const lotRaw = parseFloat(String(
        prop['Lot Area'] || prop['Lot Area sqm'] || prop['LA'] || prop.LotArea || '0'
      ).replace(/[^\d.]/g, '')) || 0
      if (parsed.minLotArea && lotRaw > 0 && lotRaw < parsed.minLotArea) return false
      if (parsed.maxLotArea && lotRaw > 0 && lotRaw > parsed.maxLotArea) return false
      // Floor area
      const floorRaw = parseFloat(String(prop['Floor Area'] || prop.FloorArea || '0').replace(/[^\d.]/g, '')) || 0
      if (parsed.minFloorArea && floorRaw > 0 && floorRaw < parsed.minFloorArea) return false
      if (parsed.maxFloorArea && floorRaw > 0 && floorRaw > parsed.maxFloorArea) return false
      // Price
      const propPrice = parseFloat(String(prop['Listing Price'] || prop.ListingPrice || prop.Price || '0').replace(/[^\d.]/g, '')) || 0
      if (parsed.minPrice && propPrice < parsed.minPrice) return false
      if (parsed.maxPrice && propPrice > parsed.maxPrice) return false
      // Bedrooms
      if (parsed.bedrooms) {
        const propBeds = parseInt(String(prop.Bedrooms || prop['No. of Bedrooms'] || '0').replace(/[^\d]/g, '')) || 0
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

  const formatPrice = (price: any): string => {
    if (!price) return 'Price not specified'
    const num = parseFloat(String(price).replace(/[^\d.]/g, '')) || 0
    if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `₱${(num / 1_000).toFixed(0)}K`
    return `₱${num.toLocaleString()}`
  }

  const formatArea = (prop: any): string => {
    // Resolve lot area from all known column variants incl. "LA" abbreviation
    const getLot = () => String(
      prop['Lot Area'] || prop['Lot Area sqm'] || prop['LA'] || prop.LotArea || ''
    ).replace(/[^\d.]/g, '').replace(/\.+/g, '.')
    const getFloor = () => String(
      prop['Floor Area'] || prop['Floor Area sqm'] || prop.FloorArea || ''
    ).replace(/[^\d.]/g, '').replace(/\.+/g, '.')

    const lotNum = getLot()
    const floorNum = getFloor()
    const lotValid = lotNum !== '' && !isNaN(parseFloat(lotNum)) && parseFloat(lotNum) > 0
    const floorValid = floorNum !== '' && !isNaN(parseFloat(floorNum)) && parseFloat(floorNum) > 0

    if (lotValid && floorValid) return `Lot: ${lotNum} sqm | Floor: ${floorNum} sqm`
    if (lotValid) return `Lot area: ${lotNum} sqm`
    if (floorValid) return `Floor area: ${floorNum} sqm`
    return 'Area not specified'
  }

  // --- FAQ matching ---
  const findBestMatch = (query: string): string => {
    const lq = query.toLowerCase()
    for (const [key, value] of Object.entries(FAQ_DATABASE)) {
      if (lq.includes(key) || key.includes(lq)) return value
    }
    const keywords = lq.split(' ')
    for (const [key, value] of Object.entries(FAQ_DATABASE)) {
      const keyWords = key.split(' ')
      const matches = keywords.filter((kw: string) => keyWords.some((k: string) => k.includes(kw) || kw.includes(k))).length
      if (matches >= 2) return value
    }
    return 'I\'m not sure about that. Try asking about: buying process, taxes, documents needed, financing, or contact information. Or select "Looking for Property" to search for properties.'
  }

  // --- Property search handler ---
  const runPropertySearch = (input: string): string => {
    const parsed = parsePropertyQuery(input)

    // Build a summary of detected filters
    const filters: string[] = []
    if (parsed.location) filters.push(`📍 Location: **${parsed.location}**`)
    if (parsed.minLotArea || parsed.maxLotArea) {
      if (parsed.minLotArea && parsed.maxLotArea)
        filters.push(`📐 Lot area: ~${Math.round((parsed.minLotArea + parsed.maxLotArea) / 2)} sqm`)
      else if (parsed.minLotArea)
        filters.push(`📐 Lot area: at least ${parsed.minLotArea} sqm`)
      else
        filters.push(`📐 Lot area: up to ${parsed.maxLotArea} sqm`)
    }
    if (parsed.minFloorArea || parsed.maxFloorArea) {
      if (parsed.minFloorArea && parsed.maxFloorArea)
        filters.push(`🏠 Floor area: ~${Math.round((parsed.minFloorArea + parsed.maxFloorArea) / 2)} sqm`)
      else if (parsed.minFloorArea)
        filters.push(`🏠 Floor area: at least ${parsed.minFloorArea} sqm`)
      else
        filters.push(`🏠 Floor area: up to ${parsed.maxFloorArea} sqm`)
    }
    if (parsed.minPrice || parsed.maxPrice) {
      if (parsed.minPrice && parsed.maxPrice)
        filters.push(`💰 Budget: ₱${(parsed.minPrice / 1e6).toFixed(1)}M – ₱${(parsed.maxPrice / 1e6).toFixed(1)}M`)
      else if (parsed.maxPrice)
        filters.push(`💰 Budget: under ₱${(parsed.maxPrice / 1e6).toFixed(1)}M`)
      else
        filters.push(`💰 Budget: above ₱${(parsed.minPrice! / 1e6).toFixed(1)}M`)
    }
    if (parsed.bedrooms) filters.push(`🛏️ Bedrooms: ${parsed.bedrooms}`)
    if (parsed.propertyType) filters.push(`🏷️ Type: ${parsed.propertyType}`)

    if (filters.length === 0) {
      return `I couldn't detect specific filters from your message. Try something like:\n- "110 sqm lot, near Clark"\n- "House and lot in San Fernando, under 5M"\n- "3 bedroom condo, Angeles City"\n\n📞 Call us at **09393440944** for direct assistance!`
    }

    const results = filterProperties(parsed)
    let response = `Searching with:\n${filters.join('\n')}\n\n`

    if (results.length > 0) {
      response += `**Found ${results.length} matching propert${results.length === 1 ? 'y' : 'ies'}:**\n\n`
      results.forEach((prop, index) => {
        const propertyId = prop['Property ID'] || prop.id
        const displayId = propertyId > 2 ? propertyId - 1 : propertyId
        const location = prop.Location || prop.Address || 'Location not specified'
        const price = formatPrice(prop['Listing Price'] || prop.ListingPrice || prop.Price)
        const propLink = `/properties/${displayId}`

        // Build area lines separately so both lot and floor show when available
        const lotRaw = String(
          prop['Lot Area'] || prop['Lot Area sqm'] || prop['LA'] || prop.LotArea || ''
        ).replace(/[^\d.]/g, '').replace(/\.+/g, '.')
        const floorRaw = String(
          prop['Floor Area'] || prop['Floor Area sqm'] || prop.FloorArea || ''
        ).replace(/[^\d.]/g, '').replace(/\.+/g, '.')
        const lotNum = lotRaw && !isNaN(parseFloat(lotRaw)) && parseFloat(lotRaw) > 0 ? lotRaw : ''
        const floorNum = floorRaw && !isNaN(parseFloat(floorRaw)) && parseFloat(floorRaw) > 0 ? floorRaw : ''

        response += `${index + 1}. **Property ID: ${displayId}**\n`
        response += `   📍 ${location}\n`
        response += `   💰 ${price}\n`
        if (lotNum) response += `   📐 Lot area: ${lotNum} sqm\n`
        if (floorNum) response += `   🏠 Floor area: ${floorNum} sqm\n`
        if (!lotNum && !floorNum) response += `   📐 Area: not specified\n`
        response += `   <a href="${propLink}" target="_blank" style="color: #2563eb; text-decoration: underline;">View Property →</a>\n\n`
      })
    } else {
      response += `No properties matched your search. Try broadening your criteria — different area, higher budget, or different lot size.\n\n`
    }

    response += `📞 Call us at **09393440944** for personalized assistance!`
    return response
  }

  // --- Yes / No handler ---
  const handleYesNo = (response: string) => {
    const userMessage: Message = {
      id: messages.length + 1,
      text: response,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    const isPagibig = waitingForPagibigSteps
    setWaitingForYesNo(false)
    setWaitingForPagibigSteps(false)

    setTimeout(() => {
      if (isPagibig) {
        // Pag-IBIG steps follow-up
        const text = response.toLowerCase() === 'yes'
          ? FAQ_DATABASE['pag-ibig steps']
          : `No problem! Feel free to ask about anything else or contact us at 📞 **09393440944** for personalized assistance.`
        setMessages(prev => [...prev, { id: prev.length + 1, text, sender: 'bot', timestamp: new Date() }])
      } else {
        // Property search follow-up
        if (response.toLowerCase() === 'yes') {
          setPropertySearch({ step: 'freeform' })
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            text: `Let's search again! Describe what you're looking for:\n\n**Examples:**\n- "110 sqm lot area, near Clark"\n- "House and lot in San Fernando, under 5M"\n- "3 bedroom, Mabalacat, 2M to 4M"`,
            sender: 'bot',
            timestamp: new Date(),
          }])
        } else {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            text: `Thank you for using ${businessName}! Feel free to start a new search anytime. 📞 09393440944`,
            sender: 'bot',
            timestamp: new Date(),
          }])
        }
      }
    }, 500)
  }

  // --- Send handler ---
  const handleSend = (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim()
    if (!text) return

    const userMessage: Message = {
      id: messages.length + 1,
      text,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    setTimeout(() => {
      let botResponse = ''
      let searchCompleted = false

      if (conversationType === 'looking' && propertySearch?.step === 'freeform') {
        botResponse = runPropertySearch(text)
        searchCompleted = true
        setPropertySearch(null)
      } else if (conversationType) {
        botResponse = findBestMatch(text)
      } else {
        botResponse = 'Please select a conversation type first.'
      }

      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      }])
      setIsTyping(false)

      // Pag-IBIG overview → ask for step-by-step
      const isPagibigOverview =
        botResponse === FAQ_DATABASE['pag-ibig'] || botResponse === FAQ_DATABASE['pagibig']
      if (isPagibigOverview) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            text: 'Would you like to see the step-by-step Pag-IBIG housing loan process?',
            sender: 'bot',
            timestamp: new Date(),
          }])
          setWaitingForPagibigSteps(true)
          setWaitingForYesNo(true)
        }, 800)
        return
      }

      // Property search completed → ask to search again
      if (searchCompleted) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            text: 'Would you like to search for more properties?',
            sender: 'bot',
            timestamp: new Date(),
          }])
          setWaitingForYesNo(true)
        }, 1000)
      }
    }, 1000)
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className={`fixed z-50 bg-white shadow-2xl flex flex-col
          ${isMinimized
            ? 'bottom-6 right-6 w-80 rounded-lg'
            : 'bottom-0 right-0 w-full h-[100dvh] rounded-none sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] sm:rounded-lg sm:max-h-[calc(100vh-3rem)]'
          }`}>
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-none sm:rounded-t-lg flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Real Estate Assistant</h3>
                <p className="text-xs text-blue-100">{businessName}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!isMinimized && (
            <>
              {/* Topic selection */}
              {!conversationType ? (
                <div className="p-6 bg-gray-50 flex-1 overflow-y-auto">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#000000' }}>What can I help you with?</h3>
                  <div className="space-y-2">
                    {Object.entries(conversationTypes).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => selectConversationType(key as ConversationType)}
                        className="w-full p-3 text-left bg-white hover:bg-blue-50 rounded-lg border"
                        style={{ color: '#000000' }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Topic bar */}
                  <div className="px-4 py-2 bg-blue-50 border-b">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium" style={{ color: '#1e40af' }}>
                        {conversationTypes[conversationType]}
                      </span>
                      <button
                        onClick={resetChat}
                        className="text-xs hover:underline font-bold bg-blue-100 px-2 py-1 rounded"
                        style={{ color: '#1e40af' }}
                      >
                        ← Back
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map(message => (
                      <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-4 ${message.sender === 'user' ? 'bg-blue-600' : 'bg-white shadow-md'}`}>
                          <div
                            className="text-sm whitespace-pre-line"
                            style={{ color: message.sender === 'user' ? '#ffffff' : '#000000' }}
                            dangerouslySetInnerHTML={{
                              __html: message.text
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br/>'),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white shadow rounded-lg p-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick questions (non-search conversations) */}
                  {conversationType !== 'looking' && !waitingForYesNo && messages.length > 0 && (
                    <div className="p-3 bg-white border-t">
                      <p className="text-xs mb-2 font-medium" style={{ color: '#4b5563' }}>Quick questions:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {quickQuestions[conversationType]?.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickQuestion(question)}
                            className="text-xs bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded text-left transition-colors border border-blue-200"
                            style={{ color: '#1e40af' }}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Yes / No buttons */}
                  {waitingForYesNo && (
                    <div className="p-4 bg-white border-t">
                      {waitingForPagibigSteps && (
                        <p className="text-xs text-gray-500 mb-2 text-center">Show step-by-step Pag-IBIG process?</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleYesNo('Yes')}
                          className="flex-1 p-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => handleYesNo('No')}
                          className="flex-1 p-2 bg-red-500 text-white rounded hover:bg-red-600 font-medium"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  {!waitingForYesNo && (
                    <div className="p-4 bg-white border-t">
                      <div className="flex gap-2">
                        <Input
                          value={inputText}
                          onChange={e => setInputText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSend()}
                          placeholder={
                            conversationType === 'looking'
                              ? 'e.g. 110 sqm lot, near Clark, under 5M'
                              : 'Type your message...'
                          }
                          className="flex-1"
                          style={{ color: '#000000' }}
                        />
                        <Button onClick={() => handleSend()} disabled={!inputText.trim()} size="icon">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
