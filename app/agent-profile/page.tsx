'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Phone, Award, Briefcase, Save } from 'lucide-react'

function AgentProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [agentId, setAgentId] = useState<number | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginRole, setLoginRole] = useState<'agent' | 'broker' | 'superadmin'>('agent')
  const [loginError, setLoginError] = useState('')
  const SHARED_ACCESS_PASSWORD = 'agentMliangRealty2026'
  const SUPERADMIN_EMAIL = 'jn16h7@gmail.com'
  const SUPERADMIN_PASSWORD = 'EuandaiteD_0126'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    license_number: '',
    profile_photo: '',
    bio: '',
    specialization: '',
    status: 'Active'
  })

  useEffect(() => {
    const agentIdFromUrl = searchParams.get('id')
    const emailFromUrl = searchParams.get('email')?.trim()
    const storedEmail = sessionStorage.getItem('userEmail')
    const isAuthenticated = sessionStorage.getItem('agentProfileAuth') === 'authenticated' || sessionStorage.getItem('brokerAdminAuth') === 'authenticated'

    if (agentIdFromUrl) {
      fetchAgentProfile(undefined, Number(agentIdFromUrl))
      return
    }

    if (emailFromUrl) {
      fetchAgentProfile(emailFromUrl)
      return
    }

    if (isAuthenticated && storedEmail) {
      fetchAgentProfile(storedEmail)
      return
    }

    setLoading(false)
  }, [searchParams])

  const fetchAgentProfile = async (email?: string, id?: number | null) => {
    if (!supabase) return

    setLoading(true)

    let query = supabase.from('agents').select('*')

    if (id) {
      query = query.eq('id', id)
    } else if (email) {
      query = query.eq('email', email)
    } else {
      setLoading(false)
      return
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      alert('Agent not found. Please contact your broker.')
      console.error(error)
    } else if (data) {
      setAgentId(data.id)
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        license_number: data.license_number || '',
        profile_photo: data.profile_photo || '',
        bio: data.bio || '',
        specialization: data.specialization || '',
        status: data.status || 'Active'
      })
    }
    setLoading(false)
  }

  const handleAgentLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const email = loginEmail.trim()

    if (loginRole === 'superadmin') {
      if (email !== SUPERADMIN_EMAIL || loginPassword !== SUPERADMIN_PASSWORD) {
        setLoginError('Use the superadmin email and password to sign in.')
        return
      }

      sessionStorage.setItem('brokerAdminAuth', 'authenticated')
      sessionStorage.setItem('userEmail', email)
      sessionStorage.setItem('viewAsRole', 'superadmin')
      setLoginError('')
      router.push('/settings')
      return
    }

    if (!email || loginPassword !== SHARED_ACCESS_PASSWORD) {
      setLoginError('Please enter your email and the shared access password.')
      return
    }

    if (loginRole === 'broker') {
      sessionStorage.setItem('brokerAdminAuth', 'authenticated')
      sessionStorage.setItem('userEmail', email)
      sessionStorage.setItem('viewAsRole', 'broker')
      setLoginError('')
      router.push('/broker-dashboard')
      return
    }

    sessionStorage.setItem('agentProfileAuth', 'authenticated')
    sessionStorage.setItem('userEmail', email)
    sessionStorage.setItem('loginRole', loginRole)
    setLoginError('')
    await fetchAgentProfile(email)
    router.push('/agent-profile')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('agentProfileAuth')
    sessionStorage.removeItem('brokerAdminAuth')
    sessionStorage.removeItem('userEmail')
    setAgentId(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      license_number: '',
      profile_photo: '',
      bio: '',
      specialization: '',
      status: 'Active'
    })
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !agentId) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          name: formData.name,
          phone: formData.phone,
          license_number: formData.license_number,
          profile_photo: formData.profile_photo,
          bio: formData.bio,
          specialization: formData.specialization,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId)

      if (error) throw error
      alert('Profile updated successfully!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert('Error updating profile: ' + message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!agentId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader>
            <CardTitle className="text-center">Access Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAgentLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#000000' }}>
                  Login as
                </label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value as 'agent' | 'broker' | 'superadmin')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black"
                >
                  <option value="agent">Agent</option>
                  <option value="broker">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#000000' }}>
                  Email
                </label>
                <Input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#000000' }}>
                  Password
                </label>
                <Input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="agentMliangRealty2026"
                  className="text-black"
                />
              </div>

              {loginError && (
                <p className="text-sm text-red-600">{loginError}</p>
              )}

              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>My Profile</h2>
            <p style={{ color: '#4b5563' }}>Manage your agent profile information</p>
          </div>
          <Button variant="outline" onClick={handleLogout} type="button">
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Preview</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {formData.profile_photo ? (
                <Image
                  src={formData.profile_photo}
                  alt={formData.name}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <User className="w-16 h-16 text-blue-600" />
                </div>
              )}
              <h3 className="text-xl font-bold mb-1" style={{ color: '#000000' }}>
                {formData.name || 'Your Name'}
              </h3>
              <p className="text-sm mb-2" style={{ color: '#4b5563' }}>
                {formData.specialization || 'Real Estate Agent'}
              </p>
              {formData.license_number && (
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  License: {formData.license_number}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="flex items-center text-sm font-medium mb-1" style={{ color: '#000000' }}>
                    <User className="w-4 h-4 mr-2" />
                    Full Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium mb-1" style={{ color: '#000000' }}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </label>
                  <Input
                    disabled
                    value={formData.email}
                    className="bg-gray-100"
                  />
                  <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                    Email cannot be changed. Contact your broker if needed.
                  </p>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium mb-1" style={{ color: '#000000' }}>
                    <Phone className="w-4 h-4 mr-2" />
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="09XXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium mb-1" style={{ color: '#000000' }}>
                    <Award className="w-4 h-4 mr-2" />
                    License Number
                  </label>
                  <Input
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="PRC License Number"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium mb-1" style={{ color: '#000000' }}>
                    <User className="w-4 h-4 mr-2" />
                    Profile Photo URL
                  </label>
                  <Input
                    value={formData.profile_photo}
                    onChange={(e) => setFormData({ ...formData, profile_photo: e.target.value })}
                    placeholder="https://your-photo-url.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium mb-1" style={{ color: '#000000' }}>
                    <Briefcase className="w-4 h-4 mr-2" />
                    Specialization
                  </label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g., Residential, Commercial, Luxury Homes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#000000' }}>
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell clients about yourself and your experience..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[120px]"
                    style={{ color: '#000000' }}
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function AgentProfile() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AgentProfileContent />
    </Suspense>
  )
}
