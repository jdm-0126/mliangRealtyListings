'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { User, Database, Bell, Shield, Palette, LogIn, LogOut, TrendingUp, Share2, ExternalLink, Wrench, CalendarCheck, Plus, Trash2, ChevronDown } from 'lucide-react'
import ThemeToggleButton from '@/app/(admin)/components/ThemeToggleButton'
import ColorPaletteCard from '@/app/(admin)/components/ColorPaletteCard'
import WebsiteContentEditor from '@/app/(admin)/components/WebsiteContentEditor'

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Icon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          aria-expanded={open}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          {open ? 'Collapse' : 'Expand'}
        </button>
      </div>
      {open ? <div className="space-y-6 px-4 pb-6">{children}</div> : null}
    </section>
  )
}

const SETTINGS_KEY = 'tenantSettings'
const SUPERADMIN_EMAIL = 'jn16h7@gmail.com'
const SUPERADMIN_PASSWORD = 'EuandaiteD_0126'
const BROKER_PASSWORD = 'brokerMliangAdmin2026'

export default function SettingsPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('RealtyProv1')
  const [brokerName, setBrokerName] = useState('RealtyProv1')
  const [brokerTitle, setBrokerTitle] = useState('Licensed Real Estate Broker')
  const [prcNumber, setPrcNumber] = useState('0019653')
  const [officeAddress, setOfficeAddress] = useState('S10, 2nd Floor Plaza Cristina Building, Dolores, City of San Fernando, Pampanga')
  const [contactNumber, setContactNumber] = useState('09393440944')
  const [emailAddress, setEmailAddress] = useState('contact@RealtyProv1.com')
  const [saved, setSaved] = useState(false)
  const [maintenanceMode, setMaintenanceModeState] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('')
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Social media links
  const [socialFacebook, setSocialFacebook] = useState('')
  const [socialInstagram, setSocialInstagram] = useState('')
  const [socialTiktok, setSocialTiktok] = useState('')
  const [socialYoutube, setSocialYoutube] = useState('')
  const [socialX, setSocialX] = useState('')
  const [socialLinkedin, setSocialLinkedin] = useState('')
  const [socialWhatsapp, setSocialWhatsapp] = useState('')
  const [socialViber, setSocialViber] = useState('')
  const [socialMessenger, setSocialMessenger] = useState('')
  const [socialSaved, setSocialSaved] = useState(false)

  // Agent of the day
  type AgentEntry = { name: string; title: string; phone: string }
  const DEFAULT_AGENT: AgentEntry = { name: 'M. Liang', title: 'Licensed Broker', phone: '09393440944' }
  const [agents, setAgents] = useState<AgentEntry[]>(Array(7).fill(null).map(() => ({ ...DEFAULT_AGENT })))
  const [agentsSaved, setAgentsSaved] = useState(false)
  const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // agentPool — active agents fetched from DB for the dropdown
  const [agentPool, setAgentPool] = useState<{ id: number; name: string; phone: string | null; specialization: string | null }[]>([])
  // agentsOfTheDay — 7-element array of agent IDs (one per day, null = unassigned)
  const [agentsOfTheDay, setAgentsOfTheDay] = useState<(number | null)[]>(Array(7).fill(null))

  // Booking — featured listing names shown in the booking form dropdown
  const [bookingListings, setBookingListings] = useState<string[]>([])
  const [bookingListingsSaved, setBookingListingsSaved] = useState(false)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.businessName) setBusinessName(parsed.businessName)
        if (parsed.brokerName) setBrokerName(parsed.brokerName)
        if (parsed.brokerTitle) setBrokerTitle(parsed.brokerTitle)
        if (parsed.prcNumber) setPrcNumber(parsed.prcNumber)
        if (parsed.officeAddress) setOfficeAddress(parsed.officeAddress)
        if (parsed.contactNumber) setContactNumber(parsed.contactNumber)
        if (parsed.emailAddress) setEmailAddress(parsed.emailAddress)
        // Social media
        if (parsed.socialFacebook)  setSocialFacebook(parsed.socialFacebook)
        if (parsed.socialInstagram) setSocialInstagram(parsed.socialInstagram)
        if (parsed.socialTiktok)    setSocialTiktok(parsed.socialTiktok)
        if (parsed.socialYoutube)   setSocialYoutube(parsed.socialYoutube)
        if (parsed.socialX)         setSocialX(parsed.socialX)
        if (parsed.socialLinkedin)  setSocialLinkedin(parsed.socialLinkedin)
        if (parsed.socialWhatsapp)  setSocialWhatsapp(parsed.socialWhatsapp)
        if (parsed.socialViber)     setSocialViber(parsed.socialViber)
        if (parsed.socialMessenger) setSocialMessenger(parsed.socialMessenger)
        if (Array.isArray(parsed.agentsOfTheDay) && parsed.agentsOfTheDay.length === 7)
          setAgentsOfTheDay(parsed.agentsOfTheDay)
        if (Array.isArray(parsed.featuredBookingListings))
          setBookingListings(parsed.featuredBookingListings.filter(Boolean))
      } catch {
        // ignore invalid stored settings
      }
    }

    // Load active agents from DB for the dropdown pool
    if (supabase) {
      supabase.from('agents').select('id, name, phone, specialization').eq('status', 'Active').order('name')
        .then(({ data }) => { if (data) setAgentPool(data) })
    }

    setMaintenanceModeState(localStorage.getItem('maintenanceMode') === 'true')

    // Check login status
    const auth = sessionStorage.getItem('brokerAdminAuth')
    const email = sessionStorage.getItem('userEmail')
    if (auth === 'authenticated' && email) {
      setIsLoggedIn(true)
      setUserEmail(email)
      if (email === SUPERADMIN_EMAIL) {
        setUserRole('Superadmin')
      } else {
        setUserRole('Broker/Agent')
      }
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Superadmin login
    if (loginEmail === SUPERADMIN_EMAIL && loginPassword === SUPERADMIN_PASSWORD) {
      sessionStorage.setItem('brokerAdminAuth', 'authenticated')
      sessionStorage.setItem('userEmail', loginEmail)
      sessionStorage.setItem('viewAsRole', 'superadmin')
      setIsLoggedIn(true)
      setUserEmail(loginEmail)
      setUserRole('Superadmin')
      setShowLoginForm(false)
      setLoginEmail('')
      setLoginPassword('')
      alert('Login successful as Superadmin!')
      return
    }
    
    // Broker/Admin login
    if (loginEmail && loginPassword === BROKER_PASSWORD) {
      sessionStorage.setItem('brokerAdminAuth', 'authenticated')
      sessionStorage.setItem('userEmail', loginEmail)
      sessionStorage.setItem('viewAsRole', 'broker')
      setIsLoggedIn(true)
      setUserEmail(loginEmail)
      setUserRole('Broker/Admin')
      setShowLoginForm(false)
      setLoginEmail('')
      setLoginPassword('')
      alert('Login successful as Broker/Admin!')
      return
    }
    
    alert('Invalid credentials. Use your email and the broker password.')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('brokerAdminAuth')
    sessionStorage.removeItem('userEmail')
    setIsLoggedIn(false)
    setUserEmail('')
    setUserRole('')
    router.push('/')
  }

  const saveSettings = () => {
    const settings = {
      businessName,
      brokerName,
      brokerTitle,
      prcNumber,
      officeAddress,
      contactNumber,
      emailAddress,
      socialFacebook,
      socialInstagram,
      socialTiktok,
      socialYoutube,
      socialX,
      socialLinkedin,
      socialWhatsapp,
      socialViber,
      socialMessenger,
      agentsOfTheDay: agentsOfTheDay,
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    localStorage.setItem('businessName', businessName)
    setSaved(true)
    window.dispatchEvent(new Event('storage'))
    window.setTimeout(() => setSaved(false), 2000)
  }

  const saveSocialLinks = () => {
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } catch { return {} }
    })()
    const updated = {
      ...existing,
      socialFacebook,
      socialInstagram,
      socialTiktok,
      socialYoutube,
      socialX,
      socialLinkedin,
      socialWhatsapp,
      socialViber,
      socialMessenger,
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
    setSocialSaved(true)
    window.dispatchEvent(new StorageEvent('storage', { key: SETTINGS_KEY }))
    window.setTimeout(() => setSocialSaved(false), 2000)
  }

  const saveAgents = () => {
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } catch { return {} }
    })()
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...existing, agentsOfTheDay: agentsOfTheDay }))
    setAgentsSaved(true)
    window.dispatchEvent(new StorageEvent('storage', { key: SETTINGS_KEY }))
    window.setTimeout(() => setAgentsSaved(false), 2000)
  }

  const saveBookingListings = () => {
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } catch { return {} }
    })()
    const clean = bookingListings.map(s => s.trim()).filter(Boolean)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...existing, featuredBookingListings: clean }))
    setBookingListingsSaved(true)
    window.dispatchEvent(new StorageEvent('storage', { key: SETTINGS_KEY }))
    window.setTimeout(() => setBookingListingsSaved(false), 2000)
  }
  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Settings</h2>
          <p className="text-gray-600">Manage your application preferences and configuration</p>
        </div>

        <div className="space-y-6">
          {/* Login/Logout Section */}
          <CollapsibleSection title="Account Status" icon={Shield}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              {isLoggedIn ? (
                <div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg mb-4">
                    <div>
                      <h3 className="font-medium text-green-900">Logged In</h3>
                      <p className="text-sm text-green-700">Email: {userEmail}</p>
                      <p className="text-sm text-green-700">Role: {userRole}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div>
                  {showLoginForm ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                          Email
                        </label>
                        <Input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                          Password
                        </label>
                        <Input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">
                          <LogIn className="w-4 h-4 mr-2" />
                          Login
                        </Button>
                        <Button variant="outline" onClick={() => setShowLoginForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">Not logged in</p>
                      <Button onClick={() => setShowLoginForm(true)}>
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          </CollapsibleSection>
          {/* Profile Settings */}
          <CollapsibleSection title="Profile Settings" icon={User}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Business Name
                  </label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Broker Name
                  </label>
                  <Input value={brokerName} onChange={(e) => setBrokerName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Broker Title
                  </label>
                  <Input value={brokerTitle} onChange={(e) => setBrokerTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    PRC License Number
                  </label>
                  <Input value={prcNumber} onChange={(e) => setPrcNumber(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Contact Number
                  </label>
                  <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Email Address
                  </label>
                  <Input type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                  Office Address
                </label>
                <Input value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={saveSettings}>Save Profile</Button>
                {saved && <span className="text-sm text-green-600">Profile saved</span>}
              </div>
            </CardContent>
          </Card>
          </CollapsibleSection>

          {/* Social Media Links */}
          <CollapsibleSection title="Social Media Links" icon={Share2}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Share2 className="w-5 h-5 mr-2" />
                  Social Media Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                These links appear in the public website footer. Leave blank to hide a platform.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Facebook */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    <span className="text-blue-600">f</span> Facebook
                  </label>
                  <Input
                    type="url"
                    value={socialFacebook}
                    onChange={e => setSocialFacebook(e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                {/* Instagram */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    <span className="text-pink-500">📸</span> Instagram
                  </label>
                  <Input
                    type="url"
                    value={socialInstagram}
                    onChange={e => setSocialInstagram(e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
                {/* TikTok */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    <span>🎵</span> TikTok
                  </label>
                  <Input
                    type="url"
                    value={socialTiktok}
                    onChange={e => setSocialTiktok(e.target.value)}
                    placeholder="https://tiktok.com/@yourhandle"
                  />
                </div>
                {/* YouTube */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    <span className="text-red-600">▶</span> YouTube
                  </label>
                  <Input
                    type="url"
                    value={socialYoutube}
                    onChange={e => setSocialYoutube(e.target.value)}
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
                {/* X (Twitter) */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    <span className="font-bold">𝕏</span> X (Twitter)
                  </label>
                  <Input
                    type="url"
                    value={socialX}
                    onChange={e => setSocialX(e.target.value)}
                    placeholder="https://x.com/yourhandle"
                  />
                </div>
                {/* LinkedIn */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    <span className="text-blue-700">in</span> LinkedIn
                  </label>
                  <Input
                    type="url"
                    value={socialLinkedin}
                    onChange={e => setSocialLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                {/* WhatsApp */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    <span className="text-green-500">💬</span> WhatsApp
                  </label>
                  <Input
                    type="tel"
                    value={socialWhatsapp}
                    onChange={e => setSocialWhatsapp(e.target.value)}
                    placeholder="09XXXXXXXXX or 639XXXXXXXXX"
                  />
                  <p className="text-xs text-gray-400 mt-1">Enter your phone number. The WhatsApp link is generated automatically.</p>
                  {socialWhatsapp && (
                    <a
                      href={`https://wa.me/${socialWhatsapp.replace(/\D/g, '').replace(/^0/, '63')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:underline mt-1 inline-block"
                    >
                      Preview: wa.me/{socialWhatsapp.replace(/\D/g, '').replace(/^0/, '63')}
                    </a>
                  )}
                </div>
                {/* Viber */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    <span className="text-purple-500">📲</span> Viber
                  </label>
                  <Input
                    type="tel"
                    value={socialViber}
                    onChange={e => setSocialViber(e.target.value)}
                    placeholder="09XXXXXXXXX or 639XXXXXXXXX"
                  />
                  <p className="text-xs text-gray-400 mt-1">Enter your phone number. The Viber link is generated automatically.</p>
                  {socialViber && (
                    <span className="text-xs text-purple-500 mt-1 inline-block">
                      Preview: viber://contact?number=+{socialViber.replace(/\D/g, '').replace(/^0/, '63')}
                    </span>
                  )}
                </div>
                {/* Messenger */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    <span style={{ color: '#0084FF' }}>💬</span> Facebook Messenger URL
                  </label>
                  <Input
                    type="url"
                    value={socialMessenger}
                    onChange={e => setSocialMessenger(e.target.value)}
                    placeholder="https://m.me/YourPageName"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Used for the "Chat on Messenger" button on the public site. Get your link at{' '}
                    <a href="https://www.facebook.com/pages/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">facebook.com/pages</a>
                    {' '}→ your page → About → Messenger link.
                  </p>
                  {socialMessenger && (
                    <a href={socialMessenger} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                      Preview: {socialMessenger}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={saveSocialLinks}>Save Social Links</Button>
                {socialSaved && <span className="text-sm text-green-600">Social links saved ✓</span>}
              </div>
            </CardContent>
          </Card>
          </CollapsibleSection>

          {/* Agent of the Day */}
          <CollapsibleSection title="Agent of the Day" icon={User}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Agent of the Day
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Assign an agent from your team to each day of the week. Shown on the public "Book a Viewing" section.
              </p>
              {agentPool.length === 0 ? (
                <div className="rounded-lg border p-4 text-sm text-gray-500" style={{ borderColor: 'hsl(var(--border))' }}>
                  No active agents found.{' '}
                  <a href="/admin/agents" className="text-blue-600 hover:underline">Add agents first →</a>
                </div>
              ) : (
                <div className="space-y-3">
                  {DAY_LABELS.map((day, i) => (
                    <div key={day} className="flex items-center gap-4">
                      <span className="w-24 text-xs font-semibold uppercase tracking-widest flex-shrink-0"
                        style={{ color: 'hsl(var(--muted-foreground))' }}>{day}</span>
                      <select
                        value={agentsOfTheDay[i] ?? ''}
                        onChange={e => setAgentsOfTheDay(prev =>
                          prev.map((v, idx) => idx === i ? (e.target.value ? Number(e.target.value) : null) : v)
                        )}
                        className="flex-1 px-3 py-2 rounded-lg border text-sm"
                        style={{
                          background: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          color: 'hsl(var(--foreground))',
                        }}
                      >
                        <option value="">— No agent assigned —</option>
                        {agentPool.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name}{a.specialization ? ` · ${a.specialization}` : ''}{a.phone ? ` · ${a.phone}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={saveAgents} disabled={agentPool.length === 0}>Save Agents</Button>
                {agentsSaved && <span className="text-sm text-green-600">Agents saved ✓</span>}
              </div>
            </CardContent>
          </Card>
          </CollapsibleSection>

          {/* Booking — Featured Listings */}
          <CollapsibleSection title="Booking — Featured Listings" icon={CalendarCheck}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarCheck className="w-5 h-5 mr-2" />
                  Booking — Featured Listings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                These property names appear as options in the public booking form dropdown.
                Leave empty to let guests type their own property of interest.
              </p>
              <div className="space-y-2">
                {bookingListings.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={e => setBookingListings(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                      placeholder="e.g. House & Lot – Brgy. Dolores, San Fernando"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setBookingListings(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBookingListings(prev => [...prev, ''])}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Listing
              </Button>
              <div className="flex items-center gap-3 pt-1">
                <Button onClick={saveBookingListings}>Save Listings</Button>
                {bookingListingsSaved && <span className="text-sm text-green-600">Saved ✓</span>}
              </div>
            </CardContent>
          </Card>
          </CollapsibleSection>

          {/* Maintenance Mode */}
          <CollapsibleSection title="Maintenance Mode" icon={Wrench}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="w-5 h-5 mr-2" />
                  Maintenance Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                When enabled, an edit toolbar appears on the public <strong>/listings</strong> and <strong>home</strong> pages.
                Allows quick inline editing of listing type, description, and preview photo without going to the admin panel.
              </p>
              <div className="flex items-center justify-between p-4 rounded-lg border" style={{ background: maintenanceMode ? 'rgb(254 242 242)' : 'rgb(240 253 244)', borderColor: maintenanceMode ? 'rgb(252 165 165)' : 'rgb(134 239 172)' }}>
                <div>
                  <p className="font-medium" style={{ color: maintenanceMode ? 'rgb(153 27 27)' : 'rgb(20 83 45)' }}>
                    {maintenanceMode ? '🔧 Maintenance Mode ON' : '✅ Maintenance Mode OFF'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: maintenanceMode ? 'rgb(185 28 28)' : 'rgb(22 101 52)' }}>
                    {maintenanceMode ? 'Edit toolbar visible on public pages' : 'Public pages are in normal view mode'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !maintenanceMode
                    setMaintenanceModeState(next)
                    if (next) localStorage.setItem('maintenanceMode', 'true')
                    else localStorage.removeItem('maintenanceMode')
                    window.dispatchEvent(new Event('maintenanceModeChange'))
                  }}
                  className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none"
                  style={{ background: maintenanceMode ? 'hsl(var(--primary))' : '#d1d5db' }}
                >
                  <span
                    className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                    style={{ transform: maintenanceMode ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
          </CollapsibleSection>

          {/* Database Settings */}
          <CollapsibleSection title="Database Configuration" icon={Database}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Database Configuration
                  </span>
                {userRole === 'Superadmin' && (
                  <a
                    href="/admin/tenant-management"
                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md"
                    style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.08)' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Tenant Management
                  </a>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-green-900">Supabase Connection</h3>
                  <p className="text-sm text-green-700">Connected and operational</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Table Name
                  </label>
                  <Input defaultValue="mlianglistings" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Records Count
                  </label>
                  <Input defaultValue="Loading..." disabled />
                </div>
              </div>
              <Button variant="outline">Test Connection</Button>
            </CardContent>
          </Card>
          </CollapsibleSection>

          {/* Notification Settings */}
          <CollapsibleSection title="Notifications" icon={Bell}>
            <Card>
              <CardContent className="space-y-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium" style={{ color: '#000000' }}>New Property Alerts</h3>
                    <p className="text-sm" style={{ color: '#000000' }}>Get notified when new properties are added</p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium" style={{ color: '#000000' }}>Status Updates</h3>
                    <p className="text-sm" style={{ color: '#000000' }}>Receive updates when property status changes</p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium" style={{ color: '#000000' }}>Facebook Integration</h3>
                    <p className="text-sm" style={{ color: '#000000' }}>Enable Facebook posting features</p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
          </CollapsibleSection>

          {/* Security Settings */}
          <CollapsibleSection title="Security & Privacy" icon={Shield}>
            <Card>
              <CardContent>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium" style={{ color: '#000000' }}>Two-Factor Authentication</h3>
                    <p className="text-sm" style={{ color: '#000000' }}>Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium" style={{ color: '#000000' }}>Session Timeout</h3>
                    <p className="text-sm" style={{ color: '#000000' }}>Automatically log out after inactivity</p>
                  </div>
                  <select className="px-3 py-1 border border-gray-300 rounded-md text-sm text-black">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>2 hours</option>
                    <option>Never</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
          </CollapsibleSection>

          {/* Appearance Settings */}
          <CollapsibleSection title="Appearance" icon={Palette}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>Admin Panel Theme</h3>
                  <p className="text-sm mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Switch between light and dark mode. Your preference is saved automatically.
                  </p>
                  <ThemeToggleButton />
                </div>
              </div>
            </CardContent>
          </Card>
          </CollapsibleSection>

          {/* Color Palette */}
          <ColorPaletteCard />

          {/* Website content */}
          <CollapsibleSection title="Website Content Manager" icon={Database}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Website Content Manager
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Manage reusable website sections from Supabase. These values are stored in the website_content table and can power the homepage, About page, broker profiles, developer profiles, advantages, stories, and captions.
              </p>
              <div className="grid gap-4 xl:grid-cols-2">
                <WebsiteContentEditor
                  title="Home Hero"
                  sectionKey="home_hero"
                  initialValue={{ badge: 'Licensed Real Estate Broker · PRC No. 0019653', title: 'Find Your Dream Property', subtitle: 'Browse active listings and let us help you find the right place in Pampanga.', ctaLabel: 'Browse Listings', secondaryLabel: 'Contact Us' }}
                  description="Controls the homepage hero badge, heading, subtitle, and CTA labels."
                />
                <WebsiteContentEditor
                  title="Home Services"
                  sectionKey="home_services"
                  initialValue={[
                    { title: 'Property Sales', desc: 'House and lot, townhouse, and commercial properties across Pampanga.' },
                    { title: 'Rental Properties', desc: 'Residential rentals in San Fernando and nearby areas.' },
                    { title: 'Lot Sales', desc: 'Premium lots in prime Pampanga locations.' },
                  ]}
                  description="Controls the three service cards shown on the homepage."
                />
                <WebsiteContentEditor
                  title="About Hero"
                  sectionKey="about_hero"
                  initialValue={{ title: 'About Us', subtitle: 'A licensed brokerage serving buyers, investors, and property owners in Pampanga.' }}
                  description="Controls the About page hero heading and supporting copy."
                />
                <WebsiteContentEditor
                  title="About Overview"
                  sectionKey="about_overview"
                  initialValue={{ headline: 'About RealtyProv1', body: 'We help clients buy, sell, and rent properties with guidance and local expertise.', body2: 'Our team combines professionalism, market knowledge, and personalized service.' }}
                  description="Controls the main About page description blocks."
                />
                <WebsiteContentEditor
                  title="Broker Profiles"
                  sectionKey="broker_profiles"
                  initialValue={[
                    { name: 'M. Liang', title: 'Licensed Broker', phone: '09393440944', bio: 'Experienced broker focused on trusted service and property guidance.' },
                  ]}
                  description="Store broker profile cards that can be displayed on the site."
                />
                <WebsiteContentEditor
                  title="Developer Profiles"
                  sectionKey="developer_profiles"
                  initialValue={[
                    { name: 'Developer Name', title: 'Developer', strengths: ['Trusted development', 'Prime locations', 'Strong investor value'] },
                  ]}
                  description="Store developer profile entries and their strengths."
                />
                <WebsiteContentEditor
                  title="Advantages"
                  sectionKey="advantages"
                  initialValue={[
                    { title: 'Transparent Guidance', desc: 'Clear updates, honest advice, and smooth transactions.' },
                    { title: 'Local Market Expertise', desc: 'Deep knowledge of Pampanga neighborhoods and pricing.' },
                  ]}
                  description="Store advantages or value points for the site."
                />
                <WebsiteContentEditor
                  title="Featured Stories"
                  sectionKey="featured_stories"
                  initialValue={[
                    { title: 'Client Success Story', summary: 'A growing family found their ideal home with a smooth buying experience.', quote: 'We felt supported from start to finish.' },
                  ]}
                  description="Store featured stories or success highlights."
                />
                <WebsiteContentEditor
                  title="Client Stories"
                  sectionKey="client_stories"
                  initialValue={[
                    { name: 'Client Name', story: 'A short testimonial or client story you want to feature.' },
                  ]}
                  description="Store client stories or testimonials for marketing sections."
                />
                <WebsiteContentEditor
                  title="Captions"
                  sectionKey="captions"
                  initialValue={{ homepage: 'Discover properties in Pampanga.', about: 'Learn more about our brokerage and values.', contact: 'Reach out for property inquiries and appointments.' }}
                  description="Store reusable captions and copy snippets for multiple website sections."
                />
              </div>
            </CardContent>
          </Card>
          </CollapsibleSection>

          {/* SEO Tips */}
          <CollapsibleSection title="SEO Tips for Real Estate Listings" icon={TrendingUp}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  SEO Tips for Real Estate Listings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">

              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Use Location-Specific Keywords in Titles</h3>
                  <p className="text-sm text-gray-600">Include the city, barangay, or landmark in every listing title. Example: <span className="font-medium text-blue-700">"House and Lot for Sale near Clark, Mabalacat"</span> ranks better than just "House for Sale".</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Write Detailed Property Descriptions</h3>
                  <p className="text-sm text-gray-600">Describe the property fully — lot area, floor area, number of bedrooms/bathrooms, proximity to landmarks (school, hospital, highway). Longer, specific descriptions help search engines index your listing.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Add High-Quality Photos with Alt Text</h3>
                  <p className="text-sm text-gray-600">Upload clear photos of the property exterior, interior, and lot. Google Images can surface your listing. Name your images descriptively (e.g., <span className="font-medium text-blue-700">house-lot-san-fernando-pampanga.jpg</span>).</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Optimize Your Facebook Posts with Hashtags</h3>
                  <p className="text-sm text-gray-600">Use relevant hashtags on every FB/IG/TikTok post. Include both general tags (<span className="font-medium">#realestate #forsale</span>) and local tags (<span className="font-medium">#Pampanga #SanFernando #ClarkArea</span>). This improves discoverability on social search.</p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">5</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Post Consistently Across Platforms</h3>
                  <p className="text-sm text-gray-600">Share listings on Facebook, Instagram, and TikTok regularly. Platforms reward consistent posters with better organic reach. Use Reels/TikTok videos for walkthroughs — video content gets 3× more engagement than photos.</p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">6</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Include Price and Key Details in Post Copy</h3>
                  <p className="text-sm text-gray-600">Buyers search for listings with specific prices. Always include the price, lot/floor area, and number of bedrooms in the first few lines of your post. This also helps the platform algorithm match your post to the right audience.</p>
                </div>
              </div>

              {/* Step 7 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">7</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Register on Google Business Profile</h3>
                  <p className="text-sm text-gray-600">Create or claim your <span className="font-medium text-blue-700">Google Business Profile</span> (free). Add your business name, address, contact, photos, and listings. This makes you appear in local Google Search and Google Maps when buyers search "real estate agent Pampanga".</p>
                </div>
              </div>

              {/* Step 8 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">8</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Get Client Reviews and Testimonials</h3>
                  <p className="text-sm text-gray-600">Ask satisfied buyers/sellers to leave a Google review. More positive reviews boost your ranking in local search results. Even a few reviews can significantly improve trust and click-through rates.</p>
                </div>
              </div>

              {/* Step 9 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">9</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Cross-Link Between Your Listings</h3>
                  <p className="text-sm text-gray-600">When posting about one property, mention other nearby listings you have. Internal links (or mentions) keep buyers engaged and help search engines understand the breadth of your inventory in a specific area.</p>
                </div>
              </div>

              {/* Step 10 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">10</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Use a Consistent Brand Signature on Every Post</h3>
                  <p className="text-sm text-gray-600">Always end posts with your business name, broker name, PRC license number, and contact number. Consistent branding builds name recognition and helps buyers find you across platforms. Update your signature once in <span className="font-medium">Settings → Profile</span> and it applies everywhere automatically.</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">💡 Quick Win</p>
                <p className="text-sm text-blue-700 mt-1">The single highest-impact action: post a <strong>short video walkthrough</strong> of a property on TikTok and Instagram Reels with the property address in the caption. Local video content consistently outperforms static posts for real estate in the Philippines.</p>
              </div>

            </CardContent>
          </Card>
          </CollapsibleSection>

        </div>
      </div>
    </div>
  )
}