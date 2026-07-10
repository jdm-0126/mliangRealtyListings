'use client'
// app/(public)/components/ContactTabs.tsx
// Tabbed wrapper: "Inquire About a Property" vs "List Your Property"

import { useState } from 'react'
import { Search, Home } from 'lucide-react'
import InquiryForm from './InquiryForm'
import SellerForm from './SellerForm'

interface ContactTabsProps {
  contactNumber: string
  initialPropertyOfInterest?: string
  initialTab?: 'inquire' | 'sell'
}

export default function ContactTabs({ contactNumber, initialPropertyOfInterest = '', initialTab = 'inquire' }: ContactTabsProps) {
  const [activeTab, setActiveTab] = useState<'inquire' | 'sell'>(initialTab)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--est-surface)', border: '1px solid var(--est-border)' }}>
      {/* Tab bar */}
      <div className="flex" style={{ borderBottom: '1px solid var(--est-border)' }}>
        <button
          onClick={() => setActiveTab('inquire')}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all"
          style={{
            color: activeTab === 'inquire' ? 'var(--est-purple)' : 'var(--est-muted)',
            borderBottom: activeTab === 'inquire' ? '2px solid var(--est-purple)' : '2px solid transparent',
            background: 'transparent',
          }}
        >
          <Search className="w-4 h-4" />
          Inquire About a Property
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all"
          style={{
            color: activeTab === 'sell' ? 'var(--est-purple)' : 'var(--est-muted)',
            borderBottom: activeTab === 'sell' ? '2px solid var(--est-purple)' : '2px solid transparent',
            background: 'transparent',
          }}
        >
          <Home className="w-4 h-4" />
          List Your Property
        </button>
      </div>

      {/* Form content */}
      <div className="p-7">
        {activeTab === 'inquire' ? (
          <>
            <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--est-text)' }}>Send Us a Message</h2>
            <p className="text-xs mb-6" style={{ color: 'var(--est-muted)' }}>
              Interested in a property? Fill in the form and we'll get back to you shortly.
            </p>
            <InquiryForm contactNumber={contactNumber} initialPropertyOfInterest={initialPropertyOfInterest} />
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--est-text)' }}>Partner With Us</h2>
            <p className="text-xs mb-6" style={{ color: 'var(--est-muted)' }}>
              Want to sell or rent out your property? Share the details and we'll reach out to discuss how we can help you get the best deal.
            </p>
            <SellerForm contactNumber={contactNumber} />
          </>
        )}
      </div>
    </div>
  )
}
