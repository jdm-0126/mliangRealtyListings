'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { X } from 'lucide-react'

interface Agent {
  id?: number
  broker_id?: number
  name: string
  email: string
  phone?: string
  status: string
  license_number?: string
  profile_photo?: string
  bio?: string
  specialization?: string
}

interface AgentDialogProps {
  agent: Agent | null
  brokerId?: number
  isOpen: boolean
  onClose: () => void
}

export default function AgentDialog({ agent, brokerId, isOpen, onClose }: AgentDialogProps) {
  const [formData, setFormData] = useState<Agent>({
    name: '',
    email: '',
    phone: '',
    status: 'Active',
    license_number: '',
    profile_photo: '',
    bio: '',
    specialization: '',
    broker_id: brokerId
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (agent) {
      setFormData(agent)
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        status: 'Active',
        license_number: '',
        profile_photo: '',
        bio: '',
        specialization: '',
        broker_id: brokerId
      })
    }
  }, [agent, brokerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    setLoading(true)

    try {
      if (agent?.id) {
        // Update existing agent
        const { error } = await supabase
          .from('agents')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            status: formData.status,
            license_number: formData.license_number,
            profile_photo: formData.profile_photo,
            bio: formData.bio,
            specialization: formData.specialization,
            updated_at: new Date().toISOString()
          })
          .eq('id', agent.id)

        if (error) throw error
        alert('Agent updated successfully!')
      } else {
        // Create new agent
        const { error } = await supabase
          .from('agents')
          .insert([{
            ...formData,
            broker_id: brokerId
          }])

        if (error) throw error
        alert('Agent created successfully!')
      }
      onClose()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{agent ? 'Edit Agent' : 'Add New Agent'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#000000' }}>
                Name *
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#000000' }}>
                Email *
              </label>
              <Input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#000000' }}>
                Phone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="09XXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#000000' }}>
                License Number
              </label>
              <Input
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="PRC License Number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#000000' }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                style={{ color: '#000000' }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#000000' }}>
                Profile Photo URL
              </label>
              <Input
                value={formData.profile_photo}
                onChange={(e) => setFormData({ ...formData, profile_photo: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#000000' }}>
                Specialization
              </label>
              <Input
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g., Residential, Commercial, Lots"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#000000' }}>
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief description about the agent..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px]"
                style={{ color: '#000000' }}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Saving...' : agent ? 'Update Agent' : 'Create Agent'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
