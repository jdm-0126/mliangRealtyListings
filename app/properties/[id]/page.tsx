'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Share2, 
  Copy, 
  MapPin, 
  Home, 
  Maximize, 
  DollarSign,
  Camera,
  Video,
  ExternalLink,
  Calculator,
  FileText
} from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'

interface PropertyDetailsProps {
  params: Promise<{ id: string }>
}

const getEmbeddableUrl = (url: string) => {
  // Google Drive file - convert to preview mode
  if (url.includes('drive.google.com/file/d/')) {
    const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId[1]}/preview`
    }
  }
  
  // Google Drive folder - convert to embedded folder view
  if (url.includes('drive.google.com/drive/folders/')) {
    const folderId = url.match(/folders\/([a-zA-Z0-9-_]+)/)
    if (folderId) {
      return `https://drive.google.com/embeddedfolderview?id=${folderId[1]}`
    }
  }
  
  // Google Photos - extract album ID and create gallery view
  if (url.includes('photos.google.com') || url.includes('photos.app.goo.gl')) {
    // Return original URL - we'll handle this specially in the UI
    return url
  }
  
  // Dropbox - convert to direct content URL
  if (url.includes('dropbox.com')) {
    return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '?raw=1')
  }
  
  // YouTube - convert to embed format
  if (url.includes('youtube.com/watch')) {
    const videoId = url.match(/v=([a-zA-Z0-9-_]+)/)
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId[1]}`
    }
  }
  
  if (url.includes('youtu.be/')) {
    const videoId = url.match(/youtu\.be\/([a-zA-Z0-9-_]+)/)
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId[1]}`
    }
  }
  
  return url
}

const canEmbed = (url: string) => {
  // Google Photos cannot be embedded in iframes due to X-Frame-Options
  if (url.includes('photos.google.com') || url.includes('photos.app.goo.gl')) {
    return false
  }
  // Check for other non-embeddable services
  return true
}

const isGooglePhotos = (url: string) => {
  return url.includes('photos.google.com') || url.includes('photos.app.goo.gl')
}

export default function PropertyDetails({ params }: PropertyDetailsProps) {
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showFinancing, setShowFinancing] = useState(false)
  const [showProcesses, setShowProcesses] = useState(false)
  const [interestRate, setInterestRate] = useState(8)
  const [customPrice, setCustomPrice] = useState('')
  const router = useRouter()
  const { id } = React.use(params)

  useEffect(() => {
    const fetchProperty = async () => {
      if (!supabase) return
      
      // Adjust the ID: if user requests ID > 2, fetch ID + 1 from database
      const dbId = Number(id) > 2 ? Number(id) + 1 : Number(id)
      
      const { data, error } = await supabase
        .from('mlianglistings')
        .select('*')
        .eq('Property ID', dbId)
        .single()
      
      if (!error) setProperty(data)
      setLoading(false)
    }
    fetchProperty()
  }, [id])

  const { hasPhotos, hasVideo, mediaEntries } = useMemo(() => {
    if (!property) return { hasPhotos: false, hasVideo: false, mediaEntries: [] }
    
    const entries = Object.entries(property)
    const photos = entries.filter(([key, value]) => key.toLowerCase().includes('photo') && value)
    const videos = entries.filter(([key, value]) => key.toLowerCase().includes('video') && value)
    
    return {
      hasPhotos: photos.length > 0,
      hasVideo: videos.length > 0,
      mediaEntries: [...photos, ...videos]
    }
  }, [property])

  const calculateFinancing = useMemo(() => {
    if (!property) return null
    const price = customPrice ? parseFloat(customPrice) : (property['Listing Price'] || property.ListingPrice || property.Price)
    if (!price) return null
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.]/g, '')) : price
    if (isNaN(numPrice)) return null
    
    const equity = numPrice * 0.2
    const mortgage = numPrice * 0.8
    
    const terms = [5, 10, 15, 20]
    const monthlyPayments = terms.map(years => {
      const months = years * 12
      const monthlyRate = (interestRate / 100) / 12
      const monthlyPayment = (mortgage * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
      return { years, monthly: monthlyPayment }
    })
    
    return { totalPrice: numPrice, equity, mortgage, monthlyPayments }
  }, [property, interestRate, customPrice])

  const formatPrice = useMemo(() => {
    if (!property) return 'Price on request'
    const price = property['Listing Price'] || property.ListingPrice || property.Price
    if (!price) return 'Price on request'
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.]/g, '')) : price
    if (isNaN(numPrice)) return price
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice)
  }, [property])

  const fbPostPreview = useMemo(() => {
    if (!property) return ''
    let mediaInfo = ''
    if (hasPhotos && hasVideo) mediaInfo = '\n\nPM for Photos and Video'
    else if (hasPhotos) mediaInfo = '\n\nPM for Photos'
    else if (hasVideo) mediaInfo = '\n\nPM for Video'
    
    const isLotOnly = property.Type?.toLowerCase() === 'lot'
    const heading = isLotOnly ? 'LOT FOR SALE' : 'HOUSE AND LOT FOR SALE'
    const readyText = isLotOnly ? '' : '\n(ready for occupancy)'
    
    // Build property details conditionally
    let propertyDetails = ''
    
    // Add Lot Area only if it has a value
    if (property['Lot Area'] && property['Lot Area'] !== 'N/A') {
      propertyDetails += `\nLot Area: ${property['Lot Area']}`
    }
    
    // Add Floor Area only if it has a value and not lot only
    if (!isLotOnly && property['Floor Area'] && property['Floor Area'] !== 'N/A') {
      propertyDetails += `\nFloor Area: ${property['Floor Area']}`
    }
    
    // Add other details for non-lot properties
    if (!isLotOnly) {
      if (property.Bedrooms) propertyDetails += `\n${property.Bedrooms} Bedrooms`
      if (property.Bathrooms) propertyDetails += `\n${property.Bathrooms} Bathrooms`
      if (property.Carports) propertyDetails += `\n${property.Carports} Carports`
      if (property.Features) propertyDetails += `\n${property.Features}`
      if (property.Condition) propertyDetails += `\n${property.Condition}`
    }
    
    return `${heading}${readyText}
${property.Village || ''} ${property.Location || ''}
| ${property.Road || property.Street || 'Main Road'}
${property.Distance || 'Minutes from city center'}
Near ${property.Landmarks || 'Major landmarks'}
| ${property.Boundary || 'City boundary'}

Property Highlights:
${property.Model || 'Property'} ${property.Description || ''}${propertyDetails}

Community Amenities:
${property.Amenities || 'Entrance Gate with Guard\nClubhouse & Events Place\nChurch\nSwimming Pool\nBasketball Court\nPlayground\nCommunity Plaza'}

Price ${property['Listing Price'] || property.ListingPrice || property.Price || 'On request'}
MOP: ${property.MOP || 'Cash or BF'}

M. Liang Realty
Licensed Real Estate Broker
PRC No. 0019653
S10, 2nd Floor Plaza Cristina Building
Dolores, City of San Fernando, Pampanga

${property.Hashtags || '#realestate #realtor #property #home #houseforsale #homeforsale #dreamhome #newhome #homebuyers #househunting #investmentproperty #luxuryhomes #modernhomes #familyhome #readytomovein #Pampanga #Philippines'}${mediaInfo}`
  }, [property, hasPhotos, hasVideo])

  const copyToClipboard = () => {
    if (!property) return
    let mediaInfo = ''
    if (hasPhotos && hasVideo) mediaInfo = '\n\nPM for Photos and Video'
    else if (hasPhotos) mediaInfo = '\n\nPM for Photos'
    else if (hasVideo) mediaInfo = '\n\nPM for Video'
    
    const isLotOnly = property.Type?.toLowerCase() === 'lot'
    const heading = isLotOnly ? 'LOT FOR SALE' : 'HOUSE AND LOT FOR SALE'
    const readyText = isLotOnly ? '' : '\n(ready for occupancy)'
    
    // Build property details conditionally
    let propertyDetails = ''
    
    // Add Lot Area only if it has a value
    if (property['Lot Area'] && property['Lot Area'] !== 'N/A') {
      propertyDetails += `\nLot Area: ${property['Lot Area']}`
    }
    
    // Add Floor Area only if it has a value and not lot only
    if (!isLotOnly && property['Floor Area'] && property['Floor Area'] !== 'N/A') {
      propertyDetails += `\nFloor Area: ${property['Floor Area']}`
    }
    
    // Add other details for non-lot properties
    if (!isLotOnly) {
      if (property.Bedrooms) propertyDetails += `\n${property.Bedrooms} Bedrooms`
      if (property.Bathrooms) propertyDetails += `\n${property.Bathrooms} Bathrooms`
      if (property.Carports) propertyDetails += `\n${property.Carports} Carports`
      if (property.Features) propertyDetails += `\n${property.Features}`
      if (property.Condition) propertyDetails += `\n${property.Condition}`
    }
    
    const text = `${heading}${readyText}
${property.Village || ''} ${property.Location || ''}
| ${property.Road || property.Street || 'Main Road'}
${property.Distance || 'Minutes from city center'}
Near ${property.Landmarks || 'Major landmarks'}
| ${property.Boundary || 'City boundary'}

Property Highlights:
${property.Model || 'Property'} ${property.Description || ''}${propertyDetails}

Community Amenities:
${property.Amenities || 'Entrance Gate with Guard\nClubhouse & Events Place\nChurch\nSwimming Pool\nBasketball Court\nPlayground\nCommunity Plaza'}

Price ${property['Listing Price'] || property.ListingPrice || property.Price || 'On request'}
MOP: ${property.MOP || 'Cash or BF'}

M. Liang Realty
Licensed Real Estate Broker
PRC No. 0019653
S10, 2nd Floor Plaza Cristina Building
Dolores, City of San Fernando, Pampanga

${property.Hashtags || '#realestate #realtor #property #home #houseforsale #homeforsale #dreamhome #newhome #homebuyers #househunting #investmentproperty #luxuryhomes #modernhomes #familyhome #readytomovein #Pampanga #Philippines'}${mediaInfo}`
    
    navigator.clipboard.writeText(text)
    alert('Facebook post format copied to clipboard!')
  }

  const copyMortgageComputation = () => {
    if (!calculateFinancing) return
    
    const displayPropertyId = property['Property ID'] > 2 ? property['Property ID'] - 1 : property['Property ID']
    const priceLabel = customPrice ? 'Contract Price' : 'Total Price'
    const monthlyOptions = calculateFinancing.monthlyPayments.map(({ years, monthly }) => 
      `${years} Years: ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(monthly)}/month`
    ).join('\n')
    
    const text = `MORTGAGE COMPUTATION\n\nProperty #${displayPropertyId}\n${property.Village || ''}, ${property.Location || ''}\n\nFINANCING BREAKDOWN:\n${priceLabel}: ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(calculateFinancing.totalPrice)}\n20% Equity: ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(calculateFinancing.equity)}\n80% Mortgage: ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(calculateFinancing.mortgage)}\n\nMONTHLY PAYMENT OPTIONS (${interestRate}% Interest):\n${monthlyOptions}\n\n* Calculations are estimates\n* Actual rates may vary by lender\n\nM. Liang Realty\n09393440944`
    
    navigator.clipboard.writeText(text)
    alert('Mortgage computation copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Property Not Found</h2>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="outline" onClick={() => router.push('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Property #{property['Property ID'] > 2 ? property['Property ID'] - 1 : property['Property ID']}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={property.Status === 'Active' ? 'success' : property.Status === 'Draft' ? 'warning' : 'secondary'}>
                {property.Status || 'Draft'}
              </Badge>
              <Badge variant="outline">{property.Type || 'Residential'}</Badge>
              {hasPhotos && (
                <Tooltip content="Photos available">
                  <div className="flex items-center text-blue-600">
                    <Camera className="w-4 h-4 mr-1" />
                    <span className="text-sm">Photos</span>
                  </div>
                </Tooltip>
              )}
              {hasVideo && (
                <Tooltip content="Video available">
                  <div className="flex items-center text-green-600">
                    <Video className="w-4 h-4 mr-1" />
                    <span className="text-sm">Video</span>
                  </div>
                </Tooltip>
              )}
            </div>
          </div>
          
          {/* Mobile-friendly action buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Tooltip content="Share to Facebook">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  copyToClipboard();
                  const displayPropertyId = property['Property ID'] > 2 ? property['Property ID'] - 1 : property['Property ID'];
                  const text = encodeURIComponent(
                    `Property #${displayPropertyId} - ${property.Village}, ${property.Location}`
                  );
                  window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      window.location.href
                    )}&quote=${text}`,
                    "_blank",
                    "width=600,height=400"
                  );
                }}
                className="w-full"
              >
                <Share2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">FB Post</span>
              </Button>
            </Tooltip>

            <Tooltip content="Copy post text">
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyToClipboard}
                className="w-full"
              >
                <Copy className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
            </Tooltip>

            <Tooltip content="Calculate financing">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFinancing(true)}
                className="w-full"
              >
                <Calculator className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Finance</span>
              </Button>
            </Tooltip>

            <Tooltip content="Buying process guide">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProcesses(true)}
                className="w-full"
              >
                <FileText className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Process</span>
              </Button>
            </Tooltip>
          </div>
        </div>
        
        {showProcesses && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Property Buying Process in the Philippines</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowProcesses(false)}>×</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-sm">
                <p className="text-gray-900 font-medium">In the Philippines, buying a titled house and lot requires due diligence, contract execution, tax payments, notarized Deed of Absolute Sale, and title transfer at the Registry of Deeds.</p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-black mb-2">1️⃣ Due Diligence (Before Paying in Full)</h3>
                    <div className="ml-4 space-y-2">
                      <div>
                        <h4 className="font-bold text-black">A. Verify the Title (Critical Step)</h4>
                        <p className="text-gray-900">Go to the Registry of Deeds where the property is located and request a Certified True Copy (CTC) of the title.</p>
                        <p className="font-bold text-black mt-1">Check:</p>
                        <ul className="list-disc ml-6 text-gray-900">
                          <li>Title number matches seller's copy</li>
                          <li>Owner's name matches valid government ID</li>
                          <li>No liens, encumbrances, mortgage annotations</li>
                          <li>No adverse claims</li>
                          <li>If mortgaged → ensure bank issues a Release of Mortgage before transfer</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-black">B. Verify Real Property Tax</h4>
                        <p className="text-gray-900">Go to the City/Municipal Assessor's Office and Treasurer's Office.</p>
                        <p className="font-bold text-black mt-1">Request:</p>
                        <ul className="list-disc ml-6 text-gray-900">
                          <li>Latest Tax Declaration</li>
                          <li>Real Property Tax Clearance</li>
                          <li>Confirm no unpaid amilyar</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-black">C. Inspect the Property</h4>
                        <ul className="list-disc ml-6 text-gray-900">
                          <li>Confirm boundaries match title technical description</li>
                          <li>Check for informal settlers</li>
                          <li>Verify road access</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-black mb-2">2️⃣ Contract to Sell (Optional but Common)</h3>
                    <div className="ml-4 text-gray-900">
                      <p>If installment basis:</p>
                      <ul className="list-disc ml-6">
                        <li>Execute Contract to Sell</li>
                        <li>Include payment terms</li>
                        <li>Include penalties, turnover conditions</li>
                      </ul>
                      <p className="mt-2">If straight cash → proceed to Deed of Absolute Sale.</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-black mb-2">3️⃣ Execute Deed of Absolute Sale (DOAS)</h3>
                    <div className="ml-4 text-gray-900">
                      <p>Once fully paid:</p>
                      <p className="font-bold text-black mt-1">Prepare:</p>
                      <ul className="list-disc ml-6">
                        <li>Deed of Absolute Sale</li>
                        <li>IDs of buyer & seller</li>
                        <li>Marriage certificate (if married)</li>
                        <li>TIN numbers</li>
                      </ul>
                      <p className="mt-2 font-bold text-red-700">The Deed must be Notarized.</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-black mb-2">4️⃣ Pay Required Taxes (Within 30 Days)</h3>
                    <div className="ml-4 space-y-2">
                      <p className="text-gray-900">Go to the Bureau of Internal Revenue (BIR).</p>
                      <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-bold text-black mb-2">Required Taxes:</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between"><span className="text-black font-medium">Capital Gains Tax (CGT)</span><span className="text-black font-medium">6% - Seller pays</span></div>
                          <div className="flex justify-between"><span className="text-black font-medium">Documentary Stamp Tax (DST)</span><span className="text-black font-medium">1.5% - Buyer pays</span></div>
                        </div>
                      </div>
                      <p className="font-bold text-black">BIR Requirements:</p>
                      <ul className="list-disc ml-6 text-gray-900">
                        <li>Notarized DOAS</li>
                        <li>Original Title</li>
                        <li>Tax Declaration</li>
                        <li>Tax Clearance</li>
                        <li>IDs</li>
                        <li>BIR Form 1706 (CGT)</li>
                        <li>BIR Form 2000 (DST)</li>
                      </ul>
                      <p className="mt-2 font-bold text-red-700">⚠ CAR is mandatory before title transfer.</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-black mb-2">5️⃣ Transfer Title at Registry of Deeds</h3>
                    <div className="ml-4 space-y-2">
                      <p className="text-gray-900">Go back to the Registry of Deeds.</p>
                      <p className="font-bold text-black">Submit:</p>
                      <ul className="list-disc ml-6 text-gray-900">
                        <li>Original Owner's Duplicate Title</li>
                        <li>Notarized DOAS</li>
                        <li>CAR from BIR</li>
                        <li>Tax clearance</li>
                        <li>Transfer tax receipt</li>
                      </ul>
                      <p className="font-bold text-black mt-2">Pay:</p>
                      <ul className="list-disc ml-6 text-gray-900">
                        <li>Transfer Tax (0.5%–0.75% depending on LGU)</li>
                        <li>Registration Fee</li>
                      </ul>
                      <p className="mt-2 text-gray-900">Processing time: ~2–4 weeks.</p>
                      <p className="font-bold text-green-700">Result: New title issued under buyer's name.</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-black mb-2">6️⃣ Transfer Tax Declaration</h3>
                    <div className="ml-4 space-y-2">
                      <p className="text-gray-900">Go to: City/Municipal Assessor's Office</p>
                      <p className="font-bold text-black">Submit:</p>
                      <ul className="list-disc ml-6 text-gray-900">
                        <li>New Title</li>
                        <li>DOAS</li>
                        <li>CAR</li>
                      </ul>
                      <p className="font-bold text-green-700 mt-2">Assessor will issue: New Tax Declaration under buyer's name</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded">
                    <h3 className="font-bold text-black mb-2">🔢 Typical Cost Summary</h3>
                    <p className="text-gray-900 mb-2">For a ₱2,000,000 property:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-black font-medium">CGT (6%)</span><span className="text-black font-medium">₱120,000</span></div>
                      <div className="flex justify-between"><span className="text-black font-medium">DST (1.5%)</span><span className="text-black font-medium">₱30,000</span></div>
                      <div className="flex justify-between"><span className="text-black font-medium">Transfer Tax (~0.75%)</span><span className="text-black font-medium">₱15,000</span></div>
                      <div className="flex justify-between"><span className="text-black font-medium">Registration Fee</span><span className="text-black font-medium">~₱10,000–₱15,000</span></div>
                      <div className="flex justify-between"><span className="text-black font-medium">Notary</span><span className="text-black font-medium">₱5,000–₱20,000</span></div>
                      <div className="flex justify-between font-bold border-t pt-1"><span className="text-black">Total transaction cost</span><span className="text-black">≈ 8–10% of property value</span></div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded">
                    <h3 className="font-bold text-red-800 mb-2">⚠ Important Warnings</h3>
                    <ul className="list-disc ml-6 text-red-800 space-y-1 font-medium">
                      <li>Never pay full amount without verifying title</li>
                      <li>Avoid "Rights only" properties if you want secure ownership</li>
                      <li>If seller is married → spouse must sign</li>
                      <li>If inherited property → ensure estate tax is settled</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {showFinancing && calculateFinancing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Financing Calculator</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowFinancing(false)}>×</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">{customPrice ? 'Contract Price' : 'Total Price'}</p>
                    <p className="text-xl font-bold text-blue-600">
                      {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(calculateFinancing.totalPrice)}
                    </p>
                    {customPrice && <p className="text-xs text-blue-500 mt-1">Repriced</p>}
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">20% Equity</p>
                    <p className="text-xl font-bold text-green-600">
                      {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(calculateFinancing.equity)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">80% Mortgage</p>
                    <p className="text-xl font-bold text-orange-600">
                      {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(calculateFinancing.mortgage)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Contract Price (PHP)</label>
                    <Input 
                      type="number" 
                      value={customPrice} 
                      onChange={(e) => setCustomPrice(e.target.value)} 
                      placeholder={calculateFinancing.totalPrice.toString()}
                      className="text-gray-900 font-medium"
                    />
                    <p className="text-xs text-gray-600 mt-1">Leave empty to use listing price</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Interest Rate (%)</label>
                    <Input 
                      type="number" 
                      value={interestRate} 
                      onChange={(e) => setInterestRate(Number(e.target.value))} 
                      min="1" 
                      max="20" 
                      step="0.1"
                      className="text-gray-900 font-medium"
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Monthly Payment Options ({interestRate}% Interest)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {calculateFinancing.monthlyPayments.map(({ years, monthly }) => (
                      <div key={years} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-900">{years} Years</span>
                          <span className="text-lg font-bold text-blue-600">
                            {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(monthly)}/mo
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{years * 12} monthly payments</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <p>* Calculations are estimates based on {interestRate}% annual interest rate</p>
                  <p>* Actual rates and terms may vary by lender</p>
                  <p>* Contact M. Liang Realty for detailed financing options</p>
                </div>
                
                <Button className="w-full" onClick={copyMortgageComputation}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Mortgage Computation
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Property Image Preview */}
            <Card>
              <CardContent className="p-0">
                <div className="relative w-full h-64 sm:h-80 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg overflow-hidden">
                  {property['Preview Photo'] ? (
                    // Show uploaded preview photo
                    <div className="relative w-full h-full">
                      <img 
                        src={property['Preview Photo']} 
                        alt={`Property #${property['Property ID'] > 2 ? property['Property ID'] - 1 : property['Property ID']}`}
                        className="w-full h-full object-cover"
                      />
                      {property.Photos && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <Button asChild variant="secondary" size="sm">
                            <a href={property.Photos} target="_blank" rel="noopener noreferrer">
                              <Camera className="w-4 h-4 mr-2" />
                              View All Photos
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : property.Photos ? (
                    // No preview photo but has Google Photos link
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-8">
                        <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Property Photos Available
                        </h3>
                        <p className="text-gray-700 mb-4">
                          Click below to view the photo album
                        </p>
                        <Button asChild>
                          <a href={property.Photos} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Photo Album
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // No photos at all
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-8">
                        <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600">
                          Property #{property['Property ID'] > 2 ? property['Property ID'] - 1 : property['Property ID']}
                        </h3>
                        <p className="text-gray-500 mt-2">
                          {property.Village}, {property.Location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle>Property Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{property.Village && `${property.Village}, `}{property.Location}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property['Lot Area'] && (
                    <div className="flex items-center">
                      <Maximize className="w-5 h-5 mr-2 text-gray-400" />
                      <div><p className="text-sm text-gray-600">Lot Area</p><p className="font-medium">{property['Lot Area']} sqm</p></div>
                    </div>
                  )}
                  {property['Floor Area'] && (
                    <div className="flex items-center">
                      <Home className="w-5 h-5 mr-2 text-gray-400" />
                      <div><p className="text-sm text-gray-600">Floor Area</p><p className="font-medium">{property['Floor Area']} sqm</p></div>
                    </div>
                  )}
                </div>
                {property.Notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{property.Notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Facebook Post Preview</CardTitle>
                  <Tooltip content="Copy post text">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="w-4 h-4 mr-2" />Copy
                    </Button>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 font-medium leading-relaxed">{fbPostPreview}</pre>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Listing Price</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice}</p>
                  {property.Negotiable === 'Yes' && <Badge variant="outline" className="mt-2">Negotiable</Badge>}
                </div>
                {calculateFinancing && (
                  <Button className="w-full mt-4" onClick={() => setShowFinancing(true)}>
                    <Calculator className="w-4 h-4 mr-2" />
                    View Financing Options
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader><CardTitle>Transaction Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-600">CGT</span><span className="font-medium">{property.CGT || 'Seller'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Transfer Title</span><span className="font-medium">{property['Transfer Title'] || 'Buyer'}</span></div>
                {property['Listing Agent'] && <div className="flex justify-between"><span className="text-gray-600">Listing Agent</span><span className="font-medium">{property['Listing Agent']}</span></div>}
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
    </div>
  )
}