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

interface PropertyDetailsProps {
  params: Promise<{ id: string }>
}

const getGooglePhotoThumbnail = (url: string) => {
  if (url.includes('drive.google.com')) {
    const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId[1]}&sz=w150`
    }
  }
  return url
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
      const { data, error } = await supabase
        .from('mlianglistings')
        .select('*')
        .eq('Property ID', id)
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
    
    return `${heading}${readyText}\n📍 ${property.Village || ''} ${property.Location || ''}\n| ${property.Road || property.Street || 'Main Road'}\n🕐 ${property.Distance || 'Minutes from city center'}\n📍 Near ${property.Landmarks || 'Major landmarks'}\n| ${property.Boundary || 'City boundary'}\n✨ Property Highlights:\n${property.Model || 'Property'} ${property.Description || ''}\n🔹 Lot Area: ${property['Lot Area'] || 'N/A'}${isLotOnly ? '' : `\n🔹 Floor Area: ${property['Floor Area'] || 'N/A'}\n🔹 ${property.Bedrooms || '3'} Bedrooms\n🔹 ${property.Bathrooms || '2'} Bathrooms\n🔹 ${property.Carports || '1'} Carports\n🔹 ${property.Features || 'Fully furnished'}\n🔹 ${property.Condition || 'Move-in ready'} 😍`}\nCommunity Amenities:\n✅ ${property.Amenities || 'Entrance Gate with Guard\n✅ Clubhouse & Events Place\n✅ Church\n✅ Swimming Pool\n✅ Basketball Court\n✅ Playground\n✅ Community Plaza'}\nPrice ${property['Listing Price'] || property.ListingPrice || property.Price || 'On request'}\nMOP: ${property.MOP || 'Cash or BF'}\nM. Liang Realty\nLicensed Real Estate Broker\nPRC No. 0019653\nS10, 2nd Floor Plaza Cristina Building\nDolores, City of San Fernando, Pampanga\n${property.Hashtags || '#realestate #realtor #property #home #houseforsale #homeforsale #dreamhome #newhome #homebuyers #househunting #investmentproperty #luxuryhomes #modernhomes #familyhome #readytomovein #Pampanga #Philippines'}${mediaInfo}`
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
    
    const text = `${heading}${readyText}\n📍 ${property.Village || ''} ${property.Location || ''}\n| ${property.Road || property.Street || 'Main Road'}\n🕐 ${property.Distance || 'Minutes from city center'}\n📍 Near ${property.Landmarks || 'Major landmarks'}\n| ${property.Boundary || 'City boundary'}\n✨ Property Highlights:\n${property.Model || 'Property'} ${property.Description || ''}\n🔹 Lot Area: ${property['Lot Area'] || 'N/A'}${isLotOnly ? '' : `\n🔹 Floor Area: ${property['Floor Area'] || 'N/A'}\n🔹 ${property.Bedrooms || '3'} Bedrooms\n🔹 ${property.Bathrooms || '2'} Bathrooms\n🔹 ${property.Carports || '1'} Carports\n🔹 ${property.Features || 'Fully furnished'}\n🔹 ${property.Condition || 'Move-in ready'} 😍`}\nCommunity Amenities:\n✅ ${property.Amenities || 'Entrance Gate with Guard\n✅ Clubhouse & Events Place\n✅ Church\n✅ Swimming Pool\n✅ Basketball Court\n✅ Playground\n✅ Community Plaza'}\nPrice ${property['Listing Price'] || property.ListingPrice || property.Price || 'On request'}\nMOP: ${property.MOP || 'Cash or BF'}\nM. Liang Realty\nLicensed Real Estate Broker\nPRC No. 0019653\nS10, 2nd Floor Plaza Cristina Building\nDolores, City of San Fernando, Pampanga\n${property.Hashtags || '#realestate #realtor #property #home #houseforsale #homeforsale #dreamhome #newhome #homebuyers #househunting #investmentproperty #luxuryhomes #modernhomes #familyhome #readytomovein #Pampanga #Philippines'}${mediaInfo}`
    
    navigator.clipboard.writeText(text)
    alert('Facebook post format copied to clipboard!')
  }

  const copyMortgageComputation = () => {
    if (!calculateFinancing) return
    
    const priceLabel = customPrice ? 'Contract Price' : 'Total Price'
    const monthlyOptions = calculateFinancing.monthlyPayments.map(({ years, monthly }) => 
      `${years} Years: ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(monthly)}/month`
    ).join('\n')
    
    const text = `🏠 MORTGAGE COMPUTATION\n\nProperty #${property['Property ID']}\n📍 ${property.Village || ''}, ${property.Location || ''}\n\n💰 FINANCING BREAKDOWN:\n${priceLabel}: ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(calculateFinancing.totalPrice)}\n20% Equity: ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(calculateFinancing.equity)}\n80% Mortgage: ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(calculateFinancing.mortgage)}\n\n📅 MONTHLY PAYMENT OPTIONS (${interestRate}% Interest):\n${monthlyOptions}\n\n* Calculations are estimates\n* Actual rates may vary by lender\n\nM. Liang Realty\n09393440944`
    
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
        
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Property #{property['Property ID']}
            </h1>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant={property.Status === 'Active' ? 'success' : property.Status === 'Draft' ? 'warning' : 'secondary'}>
                {property.Status || 'Draft'}
              </Badge>
              <Badge variant="outline">{property.Type || 'Residential'}</Badge>
              {hasPhotos && <div className="flex items-center text-blue-600"><Camera className="w-4 h-4 mr-1" /><span className="text-sm">Photos</span></div>}
              {hasVideo && <div className="flex items-center text-green-600"><Video className="w-4 h-4 mr-1" /><span className="text-sm">Video</span></div>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { copyToClipboard(); const text = encodeURIComponent(`Property #${property['Property ID']} - ${property.Village}, ${property.Location}`); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${text}`, '_blank', 'width=600,height=400') }}>
              <Share2 className="w-4 h-4 mr-2" />FB Post
            </Button>
            <Button variant="outline" onClick={copyToClipboard}>
              <Copy className="w-4 h-4 mr-2" />Copy
            </Button>
            <Button variant="outline" onClick={() => setShowFinancing(true)}>
              <Calculator className="w-4 h-4 mr-2" />Financing
            </Button>
            <Button variant="outline" onClick={() => setShowProcesses(true)}>
              <FileText className="w-4 h-4 mr-2" />Processes
            </Button>
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

            {mediaEntries.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Media</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {mediaEntries.map(([key, value]) => {
                    const isPhoto = key.toLowerCase().includes('photo')
                    return (
                      <div key={key} className={`flex items-center justify-between p-4 rounded-lg ${isPhoto ? 'bg-blue-50' : 'bg-green-50'}`}>
                        <div className="flex items-center">
                          <div className="w-16 h-16 mr-4 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            {isPhoto ? (
                              <img 
                                src={getGooglePhotoThumbnail(String(value))} 
                                alt="Property photo" 
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg></div>'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="w-6 h-6 text-green-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className={`font-medium ${isPhoto ? 'text-blue-900' : 'text-green-900'}`}>{key}</span>
                            <p className={`text-sm ${isPhoto ? 'text-blue-700' : 'text-green-700'}`}>Click to {isPhoto ? 'view photos' : 'watch video'}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={String(value)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            {isPhoto ? 'View Photos' : 'Watch Video'}
                          </a>
                        </Button>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Facebook Post Preview</CardTitle>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4 mr-2" />Copy
                  </Button>
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

            <Card>
              <CardHeader><CardTitle>Transaction Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-600">CGT</span><span className="font-medium">{property.CGT || 'Seller'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Transfer Title</span><span className="font-medium">{property['Transfer Title'] || 'Buyer'}</span></div>
                {property['Listing Agent'] && <div className="flex justify-between"><span className="text-gray-600">Listing Agent</span><span className="font-medium">{property['Listing Agent']}</span></div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}