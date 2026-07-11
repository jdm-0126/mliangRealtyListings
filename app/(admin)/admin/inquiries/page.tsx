'use client'
// app/(admin)/admin/inquiries/page.tsx
// View all buyer inquiries and seller/listing submissions in one place.

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'
import { MessageSquare, Home, Phone, Mail, Calendar, Search, X, Tag } from 'lucide-react'

interface Lead {
  id: number
  full_name: string
  contact_number: string
  email: string
  property_of_interest: string | null
  message: string
  created_at: string
}

type LeadType = 'all' | 'buyer' | 'seller'

function isSellerLead(lead: Lead) {
  return lead.message?.startsWith('[SELLER INQUIRY]')
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export default function InquiriesPage() {
  const searchParams = useSearchParams()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<LeadType>(() => {
    const f = searchParams.get('filter')
    return (f === 'buyer' || f === 'seller') ? f : 'all'
  })
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      if (!supabase) { setError('Supabase not initialised.'); setLoading(false); return }
      const { data, error: err } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (err) { setError(err.message); setLoading(false); return }
      setLeads((data ?? []) as Lead[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (filter === 'buyer' && isSellerLead(l)) return false
      if (filter === 'seller' && !isSellerLead(l)) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          l.full_name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.contact_number.includes(q) ||
          (l.property_of_interest ?? '').toLowerCase().includes(q) ||
          l.message.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [leads, filter, search])

  const buyerCount = leads.filter(l => !isSellerLead(l)).length
  const sellerCount = leads.filter(l => isSellerLead(l)).length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
          <p className="text-sm text-gray-500 mt-1">
            {leads.length} total — {buyerCount} buyer, {sellerCount} seller
          </p>
        </div>
      </div>

      {/* Tab + search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Type tabs */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white flex-shrink-0">
          {([['all', 'All'], ['buyer', 'Buyers'], ['seller', 'Sellers']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: filter === val ? '#3b82f6' : 'white',
                color: filter === val ? 'white' : '#374151',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, property…"
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-sm text-gray-400">No inquiries found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => {
            const seller = isSellerLead(lead)
            const isOpen = expanded === lead.id
            return (
              <div key={lead.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-200 transition-colors">
                {/* Summary row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : lead.id)}
                  className="w-full flex items-start gap-4 px-5 py-4 text-left"
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${seller ? 'bg-purple-50' : 'bg-blue-50'}`}>
                    {seller
                      ? <Home className="w-4 h-4 text-purple-600" />
                      : <MessageSquare className="w-4 h-4 text-blue-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{lead.full_name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${seller ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {seller ? 'Seller' : 'Buyer'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {lead.property_of_interest || 'No property specified'}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-xs text-gray-400">{formatDate(lead.created_at)}</p>
                  </div>

                  <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform mt-1 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                    {/* Contact info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <a href={`tel:${lead.contact_number}`}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        <Phone className="w-3.5 h-3.5" />
                        {lead.contact_number}
                      </a>
                      <a href={`mailto:${lead.email}`}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        <Mail className="w-3.5 h-3.5" />
                        {lead.email}
                      </a>
                      <span className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(lead.created_at)}
                      </span>
                    </div>

                    {/* Property of interest */}
                    {lead.property_of_interest && (
                      <div className="flex items-start gap-2">
                        <Tag className="w-3.5 h-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{lead.property_of_interest}</p>
                      </div>
                    )}

                    {/* Message */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Message</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.message}</p>
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 flex-wrap">
                      <a href={`tel:${lead.contact_number}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        <Phone className="w-3 h-3" /> Call
                      </a>
                      <a href={`mailto:${lead.email}?subject=Re: Your Inquiry with M. Liang Realty`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:border-blue-300 transition-colors">
                        <Mail className="w-3 h-3" /> Email
                      </a>
                      <a href={`https://wa.me/${lead.contact_number.replace(/\D/g,'').replace(/^0/,'63')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors">
                        WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
