'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Users, Plus, Edit, Trash2, Mail, Phone, Shield, X } from 'lucide-react'

interface Broker {
  id: number
  name: string
  email: string
  phone: string
  status: 'Active' | 'Inactive' | 'Suspended'
  role: 'Broker' | 'Agent' | 'Admin'
  license_number?: string
  created_at: string
}

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null)
  const [formData, setFormData] = useState({
    agent_id: '',
    agent_name: '',
    email: '',
    phone: '',
    status: 'Active',
    role: 'Broker',
    license_number: ''
  })

  const SUPERADMIN_EMAIL = 'jn16h7@gmail.com'
  const SUPERADMIN_PASSWORD = 'EuandaiteD_0126'

  useEffect(() => {
    const auth = sessionStorage.getItem('brokerAdminAuth')
    if (auth === 'authenticated') {
      setIsAuthenticated(true)
      fetchBrokers()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (loginEmail === SUPERADMIN_EMAIL && loginPassword === SUPERADMIN_PASSWORD) {
      sessionStorage.setItem('brokerAdminAuth', 'authenticated')
      sessionStorage.setItem('userEmail', loginEmail)
      setIsAuthenticated(true)
      fetchBrokers()
    } else {
      alert('Invalid credentials')
    }
  }

  const fetchBrokers = async () => {
    if (!supabase) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from('brokers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.log('Error fetching brokers:', error)
    } else {
      setBrokers(data || [])
    }
    setLoading(false)
  }

  const handleCreate = () => {
    setEditingBroker(null)
    setFormData({
      agent_id: '',
      agent_name: '',
      email: '',
      phone: '',
      status: 'Active',
      role: 'Broker',
      license_number: ''
    })
    setShowDialog(true)
  }

  const handleEdit = (broker: Broker) => {
    setEditingBroker(broker)
    setFormData({
      name: broker.name,
      email: broker.email,
      phone: broker.phone,
      status: broker.status,
      role: broker.role,
      license_number: broker.license_number || ''
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!supabase) return
    
    if (!formData.name || !formData.email) {
      alert('Name and Email are required')
      return
    }

    setLoading(true)

    if (editingBroker) {
      const { error } = await supabase
        .from('brokers')
        .update(formData)
        .eq('id', editingBroker.id)
      
      if (error) {
        alert('Error updating broker: ' + error.message)
      } else {
        alert('Broker updated successfully!')
        setShowDialog(false)
        fetchBrokers()
      }
    } else {
      const { error } = await supabase
        .from('brokers')
        .insert([formData])
      
      if (error) {
        alert('Error creating broker: ' + error.message)
      } else {
        alert('Broker created successfully!')
        setShowDialog(false)
        fetchBrokers()
      }
    }
    
    setLoading(false)
  }

  const handleDelete = async (broker: Broker) => {
    if (!supabase) return
    
    const confirmDelete = confirm(`Delete ${broker.name}? This action cannot be undone.`)
    if (!confirmDelete) return

    const { error } = await supabase
      .from('brokers')
      .delete()
      .eq('id', broker.id)
    
    if (error) {
      alert('Error deleting broker: ' + error.message)
    } else {
      alert('Broker deleted successfully!')
      fetchBrokers()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-gray-100 text-gray-800'
      case 'Suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-800'
      case 'Broker': return 'bg-blue-100 text-blue-800'
      case 'Agent': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Shield className="w-6 h-6 mr-2" />
              Superadmin Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                  Email
                </label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Enter superadmin email"
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
                  placeholder="Enter password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>
                Brokers & Agents Management
              </h1>
              <p style={{ color: '#4b5563' }}>Manage your team members and their access</p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Broker
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brokers.map((broker) => (
              <Card key={broker.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold" style={{ color: '#000000' }}>
                          {broker.name}
                        </h3>
                        <div className="flex gap-2 mt-1">
                          <Badge className={getRoleColor(broker.role)}>
                            {broker.role}
                          </Badge>
                          <Badge className={getStatusColor(broker.status)}>
                            {broker.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm" style={{ color: '#4b5563' }}>
                      <Mail className="w-4 h-4 mr-2" />
                      {broker.email}
                    </div>
                    <div className="flex items-center text-sm" style={{ color: '#4b5563' }}>
                      <Phone className="w-4 h-4 mr-2" />
                      {broker.phone || 'No phone'}
                    </div>
                    {broker.license_number && (
                      <div className="flex items-center text-sm" style={{ color: '#4b5563' }}>
                        <Shield className="w-4 h-4 mr-2" />
                        License: {broker.license_number}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(broker)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(broker)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {brokers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No brokers found. Add your first broker to get started.</p>
          </div>
        )}

        {showDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{editingBroker ? 'Edit Broker' : 'Add New Broker'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowDialog(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                      Phone
                    </label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="09123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                      License Number
                    </label>
                    <Input
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                      placeholder="PRC License #"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      style={{ color: '#000000' }}
                    >
                      <option value="Agent">Agent</option>
                      <option value="Broker">Broker</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      style={{ color: '#000000' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button onClick={handleSave} disabled={loading} className="flex-1">
                    {loading ? 'Saving...' : editingBroker ? 'Update Broker' : 'Create Broker'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
