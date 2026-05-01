'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

// Real Estate FAQ Knowledge Base
const FAQ_DATABASE = {
  // Property Buying Process
  'buying process': 'The property buying process in the Philippines involves: 1) Due Diligence (verify title at Registry of Deeds), 2) Contract to Sell (if installment), 3) Execute Deed of Absolute Sale (notarized), 4) Pay taxes (CGT 6%, DST 1.5%), 5) Transfer title at Registry of Deeds, 6) Transfer Tax Declaration. Total transaction cost is approximately 8-10% of property value.',
  
  'how to buy': 'To buy property: First, verify the title at the Registry of Deeds. Check for liens, encumbrances, and ensure the seller\'s name matches. Then execute a notarized Deed of Absolute Sale, pay required taxes (CGT and DST), and transfer the title. Always conduct due diligence before paying in full.',
  
  'title verification': 'To verify a title, go to the Registry of Deeds where the property is located and request a Certified True Copy (CTC). Check: 1) Title number matches seller\'s copy, 2) Owner\'s name matches valid ID, 3) No liens or encumbrances, 4) No adverse claims, 5) If mortgaged, ensure bank releases it before transfer.',
  
  // Taxes and Fees
  'taxes': 'Property transaction taxes include: Capital Gains Tax (CGT) - 6% paid by seller, Documentary Stamp Tax (DST) - 1.5% paid by buyer, Transfer Tax - 0.5-0.75% depending on LGU, Registration Fee - varies, and Notary fees ₱5,000-₱20,000. Total is about 8-10% of property value.',
  
  'cgt': 'Capital Gains Tax (CGT) is 6% of the selling price or fair market value (whichever is higher). It is typically paid by the SELLER within 30 days of sale. This must be paid at the BIR before you can transfer the title.',
  
  'dst': 'Documentary Stamp Tax (DST) is 1.5% of the selling price or fair market value (whichever is higher). It is typically paid by the BUYER. This is required before title transfer at the Registry of Deeds.',
  
  'transfer tax': 'Transfer Tax is 0.5% to 0.75% of the selling price or fair market value, depending on your Local Government Unit (LGU). This is paid at the City/Municipal Treasurer\'s Office before title transfer.',
  
  // Documents
  'documents needed': 'Required documents: 1) Original Owner\'s Duplicate Title, 2) Notarized Deed of Absolute Sale, 3) Certificate Authorizing Registration (CAR) from BIR, 4) Tax Clearance, 5) Transfer tax receipt, 6) Valid IDs of buyer and seller, 7) Marriage certificate (if married), 8) TIN numbers.',
  
  'deed of sale': 'A Deed of Absolute Sale (DOAS) is the legal document that transfers ownership from seller to buyer. It must be NOTARIZED to be valid. It should include: property description, selling price, buyer and seller details, and signatures. This is required for title transfer.',
  
  'car': 'CAR (Certificate Authorizing Registration) is issued by the BIR after you pay the Capital Gains Tax and Documentary Stamp Tax. This is MANDATORY before you can transfer the title at the Registry of Deeds. You must get this within 30 days of the sale.',
  
  // Financing
  'financing': 'Property financing typically requires 20% equity (down payment) and 80% mortgage from a bank. Monthly payments depend on the loan term (5, 10, 15, or 20 years) and interest rate (usually 6-10%). Banks require: proof of income, valid IDs, and property appraisal.',
  
  'mortgage': 'A mortgage is a loan from a bank to purchase property. You typically need 20% down payment and can finance 80%. Interest rates range from 6-10% annually. Loan terms are usually 5, 10, 15, or 20 years. Monthly payments include principal and interest.',
  
  'down payment': 'The standard down payment is 20% of the property price. This is called equity. The remaining 80% can be financed through a bank mortgage. Some developers offer lower down payment schemes with in-house financing.',
  
  // Property Types
  'lot only': 'A lot-only property is vacant land without any structure. When buying a lot: verify boundaries match the title, check for road access, ensure no informal settlers, and confirm zoning allows your intended use. Lot-only properties don\'t have floor area, only lot area.',
  
  'house and lot': 'A house and lot includes both the land and the structure built on it. Check: lot area, floor area, number of bedrooms/bathrooms, condition of the house, and included fixtures. Verify the house matches the approved building plans.',
  
  'condominium': 'Condominiums have different ownership rules. You own the unit but share common areas. Foreigners can own condo units (up to 40% of building). Check: association dues, building rules, parking allocation, and Certificate of Title (CCT) or Condominium Certificate of Title (CCT).',
  
  // Common Issues
  'clean title': 'A "clean title" means the property has no liens, encumbrances, mortgages, or adverse claims. Verify this at the Registry of Deeds by getting a Certified True Copy. A clean title is essential for safe property purchase.',
  
  'encumbrance': 'An encumbrance is a claim or liability on a property (mortgage, lien, easement, etc.). Check the title for annotations. If there\'s a mortgage, the bank must issue a Release of Mortgage before you can transfer the title to your name.',
  
  'adverse claim': 'An adverse claim is a notice filed by someone claiming interest in the property. This is a RED FLAG. Do not proceed with the purchase until the adverse claim is resolved. Consult a lawyer immediately.',
  
  'rights only': 'Buying "rights only" means you\'re buying the seller\'s claim to the property, NOT the actual title. This is RISKY. You may face legal disputes and cannot get a clean title. Avoid "rights only" properties if you want secure ownership.',
  
  // Timeline
  'how long': 'The property buying process typically takes 2-4 months: Due diligence (1-2 weeks), Contract execution (1 week), Tax payment (1-2 weeks), Title transfer at Registry of Deeds (2-4 weeks), Tax Declaration transfer (1 week). Delays can occur if documents are incomplete.',
  
  'title transfer': 'Title transfer at the Registry of Deeds takes 2-4 weeks after submitting all required documents (original title, notarized DOAS, CAR, tax clearance, transfer tax receipt). You\'ll receive a new title under your name.',
  
  // Costs
  'closing costs': 'Closing costs (transaction costs) are approximately 8-10% of the property value. This includes: CGT (6%), DST (1.5%), Transfer Tax (0.5-0.75%), Registration Fee, and Notary fees. Budget accordingly when buying property.',
  
  'notary fee': 'Notary fees for a Deed of Absolute Sale typically range from ₱5,000 to ₱20,000, depending on the property value and notary. This is required to make the deed legally binding.',
  
  // Legal
  'lawyer': 'While not required, hiring a lawyer is HIGHLY RECOMMENDED for property transactions. A lawyer can: verify documents, check title authenticity, review contracts, ensure proper execution, and protect your interests. Fees vary but are worth the security.',
  
  'married': 'If the seller is married, BOTH SPOUSES must sign the Deed of Absolute Sale, even if only one name is on the title. This is required by law. Bring the marriage certificate when executing the deed.',
  
  'inherited property': 'For inherited property, ensure the estate tax is SETTLED before buying. The seller must show proof of estate tax payment and extrajudicial settlement. Otherwise, you may inherit tax liabilities.',
  
  // M. Liang Realty
  'contact': 'You can contact M. Liang Realty at: Phone: 09393440944, Office: S10, 2nd Floor Plaza Cristina Building, Dolores, City of San Fernando, Pampanga. PRC License No. 0019653. We are a licensed real estate broker.',
  
  'services': 'M. Liang Realty offers: Property listings (house and lot, lots, commercial), Property buying assistance, Title verification support, Financing guidance, Documentation assistance, and Property viewing arrangements. We serve Pampanga and nearby areas.',
  
  'viewing': 'To schedule a property viewing, contact us at 09393440944 or visit our office. We can arrange viewings for any listed property. Bring valid ID and be ready to discuss your budget and requirements.',
}

const GREETINGS = [
  'Hello! I\'m your Real Estate Assistant. Ask me anything about buying property in the Philippines! 🏠',
  'Hi there! I can help you with property buying questions, taxes, documents, and more. What would you like to know?',
  'Welcome! I\'m here to answer your real estate questions. Feel free to ask about the buying process, financing, or anything else!',
]

const FALLBACK_RESPONSES = [
  'I\'m not sure about that specific question. Could you try asking about: buying process, taxes, documents needed, financing, or title verification?',
  'I don\'t have information on that topic yet. Try asking about: property types, closing costs, timeline, or legal requirements.',
  'That\'s a great question! I specialize in Philippine real estate transactions. Ask me about: CGT, DST, deed of sale, mortgage, or clean titles.',
]

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: GREETINGS[0],
      sender: 'bot',
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const findBestMatch = (query: string): string => {
    const lowerQuery = query.toLowerCase()
    
    // Check for exact or partial matches
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
    
    // Return random fallback
    return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
  }

  const handleSend = () => {
    if (!inputText.trim()) return

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    // Simulate bot typing and response
    setTimeout(() => {
      const botResponse = findBestMatch(inputText)
      const botMessage: Message = {
        id: messages.length + 2,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickQuestions = [
    'How to buy property?',
    'What are the taxes?',
    'Documents needed?',
    'How much is down payment?',
    'What is CGT?',
    'How to verify title?',
  ]

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            ?
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl transition-all duration-200 ${isMinimized ? 'w-80' : 'w-96 h-[600px]'} flex flex-col`}>
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Real Estate Assistant</h3>
                <p className="text-xs text-blue-100">Online • M. Liang Realty</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-blue-700 p-1 rounded"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 shadow'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-900 shadow rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length <= 2 && (
                <div className="p-3 bg-white border-t">
                  <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInputText(question)
                          setTimeout(() => handleSend(), 100)
                        }}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-full transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 bg-white border-t rounded-b-lg">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about property buying..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputText.trim() || isTyping}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
