'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient.js'
import {
  Home,
  BarChart3,
  DollarSign,
  MapPin,
  Building2,
  Clock,
  Search,
  X,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  loadRecentSearches,
  clearRecentSearchesStorage,
  truncateQuery,
  type RecentSearchEntry,
} from '@/lib/recentSearches'
import { parsePropertyQuery, filterPropertiesByQuery } from '@/lib/parsePropertyQuery'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  total: number
  active: number
  draft: number
  sold: number
  houseAndLot: number
  lotOnly: number
  commercial: number
  featured: number
  inquiries: number
  sellerLeads: number
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  href?: string
}) {
  const inner = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      {href && (
        <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total: 0, active: 0, draft: 0, sold: 0,
    houseAndLot: 0, lotOnly: 0, commercial: 0, featured: 0,
    inquiries: 0, sellerLeads: 0,
  })
  const [recentListings, setRecentListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>([])
  const [activeQuery, setActiveQuery] = useState('')
  const [queryResults, setQueryResults] = useState<any[]>([])
  const [allData, setAllData] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    if (!supabase) { setLoading(false); return }

    // Fetch listings and leads in parallel
    const [listingsRes, leadsRes] = await Promise.all([
      supabase.from('mlianglistings').select('*').order('Property ID', { ascending: false }).limit(500),
      supabase.from('leads').select('id, message').limit(1000),
    ])

    const data = listingsRes.data
    if (listingsRes.error || !data) { setLoading(false); return }

    const leads = (leadsRes.data ?? []) as { id: number; message: string }[]
    const sellerCount = leads.filter(l => l.message?.startsWith('[SELLER INQUIRY]')).length

    setAllData(data)

    const s: Stats = {
      total: data.length,
      active: data.filter((r: any) => String(r.Status || '').toLowerCase() === 'active').length,
      draft: data.filter((r: any) => String(r.Status || '').toLowerCase() === 'draft').length,
      sold: data.filter((r: any) => String(r.Status || '').toLowerCase() === 'sold').length,
      houseAndLot: data.filter((r: any) => String(r.Type || '').toLowerCase().includes('house')).length,
      lotOnly: data.filter((r: any) => String(r.Type || '').toLowerCase() === 'lot only' || String(r.Type || '').toLowerCase() === 'lot').length,
      commercial: data.filter((r: any) => String(r.Type || '').toLowerCase().includes('commercial')).length,
      featured: data.filter((r: any) => r.featured === true).length,
      inquiries: leads.length - sellerCount,
      sellerLeads: sellerCount,
    }
    setStats(s)
    setRecentListings(data.slice(0, 5))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    setRecentSearches(loadRecentSearches())
  }, [fetchData])

  // Apply active recent search query
  useEffect(() => {
    if (!activeQuery || allData.length === 0) {
      setQueryResults([])
      return
    }
    const parsed = parsePropertyQuery(activeQuery)
    const results = filterPropertiesByQuery(allData, parsed)
    setQueryResults(results.slice(0, 6))
  }, [activeQuery, allData])

  const formatPrice = (raw: unknown) => {
    const n = typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(/[^\d.]/g, ''))
    if (!n || isNaN(n)) return '—'
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your property listings</p>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Listings" value={stats.total} icon={Home}
            color="bg-blue-50 text-blue-600" href="/admin/properties" />
          <StatCard label="Active" value={stats.active} icon={TrendingUp}
            color="bg-green-50 text-green-600" href="/admin/properties?status=active" />
          <StatCard label="Draft" value={stats.draft} icon={DollarSign}
            color="bg-yellow-50 text-yellow-600" href="/admin/properties?status=draft" />
          <StatCard label="Featured" value={stats.featured} icon={Star}
            color="bg-purple-50 text-purple-600" href="/admin/properties?featured=true" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="House & Lot" value={stats.houseAndLot} icon={Building2}
            color="bg-indigo-50 text-indigo-600" href="/admin/properties?type=house" />
          <StatCard label="Lot Only" value={stats.lotOnly} icon={MapPin}
            color="bg-orange-50 text-orange-600" href="/admin/properties?type=lot" />
          <StatCard label="Commercial" value={stats.commercial} icon={BarChart3}
            color="bg-pink-50 text-pink-600" href="/admin/properties?type=commercial" />
        </div>

        {/* ── Inquiries ── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <StatCard label="Buyer Inquiries" value={stats.inquiries} icon={MessageSquare}
            color="bg-blue-50 text-blue-600" href="/admin/inquiries?filter=buyer" />
          <StatCard label="Seller Leads" value={stats.sellerLeads} icon={Home}
            color="bg-purple-50 text-purple-600" href="/admin/inquiries?filter=seller" />
        </div>

        {/* ── Quick nav ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Properties', href: '/admin/properties', icon: Home },
            { label: 'Rentals', href: '/admin/rentals', icon: Building2 },
            { label: 'Agents', href: '/admin/agents', icon: Users },
            { label: 'Settings', href: '/admin/settings', icon: MessageSquare },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors group">
              <Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{label}</span>
            </Link>
          ))}
        </div>

        {/* ── Recent chat searches ── */}
        {recentSearches.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5" />
                Recent Chat Searches
              </div>
              <div className="flex items-center gap-3">
                {activeQuery && (
                  <span className="text-xs text-blue-600 font-medium">
                    {queryResults.length} result{queryResults.length !== 1 ? 's' : ''}
                  </span>
                )}
                {activeQuery && (
                  <button onClick={() => setActiveQuery('')}
                    className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
                <button
                  onClick={() => { clearRecentSearchesStorage(); setRecentSearches([]); setActiveQuery('') }}
                  className="text-xs text-red-400 hover:text-red-600 underline">
                  Clear all
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {recentSearches.map((entry, i) => {
                const isActive = activeQuery === entry.query
                return (
                  <button key={i}
                    onClick={() => setActiveQuery(isActive ? '' : entry.query)}
                    className={`inline-flex items-center gap-1.5 text-xs border rounded-full px-3 py-1.5 transition-all ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <Search className="w-3 h-3 flex-shrink-0" />
                    <span className="max-w-[200px] truncate">{truncateQuery(entry.query, 45)}</span>
                    {isActive && <X className="w-3 h-3 opacity-70" />}
                  </button>
                )
              })}
            </div>

            {/* Query results preview */}
            {activeQuery && queryResults.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 mb-3 font-medium">
                  Matching properties — <Link href="/admin/properties" className="text-blue-600 hover:underline">view all in Properties</Link>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {queryResults.map((p: any) => {
                    const rawId = Number(p['Property ID'])
                    const displayId = rawId > 2 ? rawId - 1 : rawId
                    return (
                      <Link key={rawId} href={`/properties/${displayId}`}
                        className="flex items-start gap-3 border border-gray-100 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                        {p['Preview Photo'] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p['Preview Photo']} alt="" className="w-14 h-14 object-cover rounded flex-shrink-0" loading="lazy" decoding="async" />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                            <Home className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            #{displayId} · {p.Type || 'Property'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{p.Location || '—'}</p>
                          <p className="text-xs font-medium text-blue-700 mt-0.5">
                            {formatPrice(p['Listing Price'] ?? p.ListingPrice ?? p.Price)}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Recently added listings ── */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recently Added</h2>
            <Link href="/admin/properties" className="text-sm text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentListings.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No listings yet</p>
            ) : (
              recentListings.map((p: any) => {
                const rawId = Number(p['Property ID'])
                const displayId = rawId > 2 ? rawId - 1 : rawId
                const status = String(p.Status || '').toLowerCase()
                return (
                  <Link key={rawId} href={`/properties/${displayId}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                    {p['Preview Photo'] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p['Preview Photo']} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <Home className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          #{displayId} · {p.Type || 'Property'}
                        </span>
                        {p.featured && (
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{p.Location || '—'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-800">
                        {formatPrice(p['Listing Price'] ?? p.ListingPrice ?? p.Price)}
                      </p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        status === 'active' ? 'bg-green-100 text-green-700' :
                        status === 'sold' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.Status || 'Draft'}
                      </span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
