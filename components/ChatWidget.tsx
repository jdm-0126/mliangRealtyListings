'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { supabase } from '@/app/lib/supabaseClient.js'

type ConversationType = 'buying' | 'selling' | 'renting' | 'investing' | 'general' | 'looking';

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

interface PropertySearch {
  location?: string
  priceRange?: string
  step: 'location' | 'price' | 'complete'
}

// Real Estate FAQ Knowledge Base
const FAQ_DATABASE: { [key: string]: string } = {
  'buying process': 'The property buying process in the Philippines involves: 1) Due Diligence (verify title at Registry of Deeds), 2) Contract to Sell (if installment), 3) Execute Deed of Absolute Sale (notarized), 4) Pay taxes (CGT 6%, DST 1.5%), 5) Transfer title at Registry of Deeds, 6) Transfer Tax Declaration. Total transaction cost is approximately 8-10% of property value.',
  'how to buy': 'To buy property: First, verify the title at the Registry of Deeds. Check for liens, encumbrances, and ensure the seller\'s name matches. Then execute a notarized Deed of Absolute Sale, pay required taxes (CGT and DST), and transfer the title.',
  'taxes': 'Property transaction taxes include: Capital Gains Tax (CGT) - 6% paid by seller, Documentary Stamp Tax (DST) - 1.5% paid by buyer, Transfer Tax - 0.5-0.75% depending on LGU, Registration Fee - varies, and Notary fees ₱5,000-₱20,000. Total is about 8-10% of property value.',
  'cgt': 'Capital Gains Tax (CGT) is 6% of the selling price or fair market value (whichever is higher). It is typically paid by the SELLER within 30 days of sale.',
  'dst': 'Documentary Stamp Tax (DST) is 1.5% of the selling price or fair market value (whichever is higher). It is typically paid by the BUYER.',
  'documents needed': 'Required documents: 1) Original Owner\'s Duplicate Title, 2) Notarized Deed of Absolute Sale, 3) Certificate Authorizing Registration (CAR) from BIR, 4) Tax Clearance, 5) Transfer tax receipt, 6) Valid IDs of buyer and seller, 7) Marriage certificate (if married), 8) TIN numbers.',
  'financing': 'Property financing typically requires 20% equity (down payment) and 80% mortgage from a bank. Monthly payments depend on the loan term (5, 10, 15, or 20 years) and interest rate (usually 6-10%).',
  'mortgage': 'A mortgage is a loan from a bank to purchase property. You typically need 20% down payment and can finance 80%. Interest rates range from 6-10% annually.',
  'down payment': 'The standard down payment is 20% of the property price. This is called equity. The remaining 80% can be financed through a bank mortgage.',
  'contact': 'You can contact M. Liang Realty at: Phone: 09393440944, Office: S10, 2nd Floor Plaza Cristina Building, Dolores, City of San Fernando, Pampanga. PRC License No. 0019653.',
  'services': 'M. Liang Realty offers: Property listings (house and lot, lots, commercial), Property buying assistance, Title verification support, Financing guidance, Documentation assistance, and Property viewing arrangements.',
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [conversationType, setConversationType] = useState<ConversationType | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [waitingForYesNo, setWaitingForYesNo] = useState(false)
  const [propertySearch, setPropertySearch] = useState<PropertySearch | null>(null)
  const [realProperties, setRealProperties] = useState<any[]>([])
  const [propertiesLoaded, setPropertiesLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const conversationTypes = {
    buying: 'Home Buying',
    selling: 'Home Selling', 
    renting: 'Rental Properties',
    investing: 'Real Estate Investment',
    general: 'General Questions',
    looking: 'Looking for Property'
  };

  useEffect(() => {
    fetchRealProperties()
  }, [])

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
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const quickQuestions: { [key: string]: string[] } = {
    buying: [
      'How to buy property?',
      'What are the taxes?',
      'What documents are needed?',
      'Tell me about financing',
      'How to verify title?',
      'Contact information'
    ],
    selling: [
      'How to sell property?',
      'What is CGT?',
      'What documents are needed?',
      'Contact information'
    ],
    renting: [
      'Rental information',
      'Contact information'
    ],
    investing: [
      'Investment advice',
      'Contact information'
    ],
    general: [
      'Services offered',
      'Contact information',
      'Office location'
    ]
  }

  const handleQuickQuestion = (question: string) => {
    setInputText(question)
    setTimeout(() => handleSend(), 100)
  }

  const resetChat = () => {
    setConversationType(null)
    setMessages([])
    setWaitingForYesNo(false)
    setPropertySearch(null)
    setInputText('')
  }

  const selectConversationType = (type: ConversationType) => {
    setConversationType(type)
    
    if (type === 'looking') {
      setPropertySearch({ step: 'location' })
      const welcomeMessage: Message = {
        id: messages.length + 1,
        text: `Great! I'll help you find the perfect property.\n\n**Where would you like the property to be located?**\n\nExamples:\n- San Fernando\n- Angeles City\n- Mabalacat\n- Mexico\n- Bacolor\n- Or any specific area in Pampanga`,
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, welcomeMessage])
    } else {
      // For other conversation types, show welcome message
      const welcomeMessage: Message = {
        id: messages.length + 1,
        text: `Great! I'm here to help with ${conversationTypes[type].toLowerCase()}. What would you like to know?`,
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, welcomeMessage])
    }
  }

  const getPropertiesByLocation = (location: string) => {
    if (!propertiesLoaded || realProperties.length === 0) return []
    
    const locationLower = location.toLowerCase()
    
    return realProperties.filter(prop => {
      const propLocation = (prop.Location || prop.Address || '').toLowerCase()
      return propLocation.includes(locationLower)
    })
  }

  const getPropertiesByLocationAndPrice = (location: string, priceRange: string) => {
    let filtered = getPropertiesByLocation(location)
    
    const priceInput = priceRange.toLowerCase()
    let minPrice = 0
    let maxPrice = Infinity
    
    if (priceInput.includes('to')) {
      const matches = priceInput.match(/(\d+(?:\.\d+)?)m?\s*to\s*(\d+(?:\.\d+)?)m?/)
      if (matches) {
        minPrice = parseFloat(matches[1]) * 1000000
        maxPrice = parseFloat(matches[2]) * 1000000
      }
    } else if (priceInput.includes('under') || priceInput.includes('below')) {
      const matches = priceInput.match(/(\d+(?:\.\d+)?)m?/)
      if (matches) {
        maxPrice = parseFloat(matches[1]) * 1000000
      }
    } else if (priceInput.includes('above') || priceInput.includes('over')) {
      const matches = priceInput.match(/(\d+(?:\.\d+)?)m?/)
      if (matches) {
        minPrice = parseFloat(matches[1]) * 1000000
      }
    }
    
    filtered = filtered.filter(prop => {
      const propPrice = parseFloat(String(prop['Listing Price'] || prop.ListingPrice || prop.Price || '0').replace(/[^\d.]/g, '')) || 0
      return propPrice >= minPrice && propPrice <= maxPrice
    })
    
    return filtered
  }

  const findBestMatch = (query: string): string => {
    const lowerQuery = query.toLowerCase()
    
    // Check for exact or partial matches in FAQ database
    for (const [key, value] of Object.entries(FAQ_DATABASE)) {
      if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
        return value
      }
    }
    
    // Check for keyword matches
    const keywords = lowerQuery.split(' ')
    for (const [key, value] of Object.entries(FAQ_DATABASE)) {
      const keyWords = key.split(' ')
      const matchCount = keywords.filter(kw => keyWords.some(k => k.includes(kw) || kw.includes(k))).length
      if (matchCount >= 2) {
        return value
      }
    }
    
    return 'I\'m not sure about that. Try asking about: buying process, taxes, documents needed, financing, or contact information. Or select "Looking for Property" to search for properties.'
  }

  const formatPrice = (price: any): string => {
    if (!price) return 'Price not specified'
    const numPrice = parseFloat(String(price).replace(/[^\d.]/g, '')) || 0
    if (numPrice >= 1000000) {
      return `₱${(numPrice / 1000000).toFixed(1)}M`
    } else if (numPrice >= 1000) {
      return `₱${(numPrice / 1000).toFixed(0)}K`
    }
    return `₱${numPrice.toLocaleString()}`
  }

  const formatArea = (prop: any): string => {
    const lotArea = prop['Lot Area'] || prop.LotArea || ''
    const floorArea = prop['Floor Area'] || prop.FloorArea || ''
    
    // Extract numeric values
    const lotNum = lotArea ? String(lotArea).replace(/[^\d]/g, '') : ''
    const floorNum = floorArea ? String(floorArea).replace(/[^\d]/g, '') : ''
    
    if (lotNum && floorNum) {
      return `${lotNum} sqm lot, ${floorNum} sqm floor`
    } else if (lotNum) {
      return `${lotNum} sqm lot`
    } else if (floorNum) {
      return `${floorNum} sqm floor`
    }
    return 'Area not specified'
  }

  const handlePropertySearch = (input: string): string | null => {
    if (!propertySearch) return null
    
    switch (propertySearch.step) {
      case 'location':
        setPropertySearch({ ...propertySearch, location: input, step: 'price' })
        return `Great! Searching in: **${input}**\n\n**What's your budget?**\n\nExamples:\n- 2M to 5M\n- Under 3M\n- Above 10M`
        
      case 'price':
        setPropertySearch({ ...propertySearch, priceRange: input, step: 'complete' })
        
        const filtered = getPropertiesByLocationAndPrice(propertySearch.location!, input)
        
        let response = `Excellent! Budget: **${input}**\n\n`
        
        if (filtered.length > 0) {
          response += `**Found ${filtered.length} properties in ${propertySearch.location} within ${input} budget:**\n\n`
          filtered.forEach((prop, index) => {
            const propertyId = prop['Property ID'] || prop.id
            const displayId = propertyId > 2 ? propertyId - 1 : propertyId
            const location = prop.Location || prop.Address || 'Location not specified'
            const price = formatPrice(prop['Listing Price'] || prop.ListingPrice || prop.Price)
            const area = formatArea(prop)
            const propLink = `/properties/${displayId}`
            
            response += `${index + 1}. **Property ID: ${displayId}**\n`
            response += `   Location: ${location}\n`
            response += `   Price: ${price}\n`
            response += `   Size: ${area}\n`
            response += `   <a href="${propLink}" target="_blank" style="color: #2563eb; text-decoration: underline;">View Property</a>\n\n`
          })
        } else {
          response += `No properties found within your budget in ${propertySearch.location}.\n\n`
        }
        
        response += `\n📞 Call us at **09393440944** for more details!`
        setPropertySearch(null)
        return response
        
      default:
        return null
    }
  }

  const handleYesNo = (response: string) => {
    const userMessage: Message = {
      id: messages.length + 1,
      text: response,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setWaitingForYesNo(false)
    
    setTimeout(() => {
      if (response.toLowerCase() === 'yes') {
        // Restart property search
        setPropertySearch({ step: 'location' })
        const botMessage: Message = {
          id: messages.length + 2,
          text: `Great! Let's find another property.\n\n**Where would you like the property to be located?**\n\nExamples:\n- San Fernando\n- Angeles City\n- Mabalacat\n- Mexico\n- Bacolor`,
          sender: 'bot',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        const botMessage: Message = {
          id: messages.length + 2,
          text: 'Thank you for using M. Liang Realty! Feel free to start a new search anytime. 📞 09393440944',
          sender: 'bot',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, botMessage])
      }
    }, 500)
  }

  const handleSend = () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    const currentInput = inputText
    setInputText('')
    setIsTyping(true)

    setTimeout(() => {
      let botResponse = ''
      
      if (conversationType === 'looking' && propertySearch) {
        const searchResponse = handlePropertySearch(currentInput)
        if (searchResponse) {
          botResponse = searchResponse
        }
      } else if (conversationType) {
        // Use FAQ database for other conversation types
        botResponse = findBestMatch(currentInput)
      } else {
        botResponse = 'Please select a conversation type first.'
      }
      
      const botMessage: Message = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
      
      // Ask if they want to search again (only for property search)
      if (conversationType === 'looking' && propertySearch?.step === 'complete') {
        setTimeout(() => {
          const followUpMessage: Message = {
            id: messages.length + 3,
            text: 'Would you like to search for more properties? (Yes/No)',
            sender: 'bot',
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, followUpMessage])
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
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl ${isMinimized ? 'w-80' : 'w-96 h-[600px]'} flex flex-col`}>
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Real Estate Assistant</h3>
                <p className="text-xs text-blue-100">M. Liang Realty</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!isMinimized && (
            <>
              {!conversationType ? (
                <div className="p-6 bg-gray-50">
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
                  <div className="px-4 py-2 bg-blue-50 border-b">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium" style={{ color: '#1e40af' }}>{conversationTypes[conversationType]}</span>
                      <button 
                        onClick={resetChat}
                        className="text-xs hover:underline font-bold bg-blue-100 px-2 py-1 rounded"
                        style={{ color: '#1e40af' }}
                      >
                        ← Back
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-4 ${message.sender === 'user' ? 'bg-blue-600' : 'bg-white shadow-md'}`}>
                          <div className="text-sm whitespace-pre-line" style={{ color: message.sender === 'user' ? '#ffffff' : '#000000' }}>
                            <div dangerouslySetInnerHTML={{ 
                              __html: message.text
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br/>')
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white shadow rounded-lg p-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Question Cards - Show for non-property search conversations */}
                  {conversationType && conversationType !== 'looking' && !waitingForYesNo && messages.length > 0 && (
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

                  {waitingForYesNo && (
                    <div className="p-4 bg-white border-t">
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

                  {!waitingForYesNo && (
                    <div className="p-4 bg-white border-t">
                      <div className="flex gap-2">
                        <Input
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                          placeholder="Type your message..."
                          className="flex-1"
                          style={{ color: '#000000' }}
                        />
                        <Button onClick={handleSend} disabled={!inputText.trim()} size="icon">
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
