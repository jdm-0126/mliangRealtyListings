'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Plus, Edit, Trash2, User, Mail, Phone, CheckCircle, XCircle } from 'lucide-react'
import AgentDialog from './AgentDialog'

interface Agent {
  id: number
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

export default function AgentManagement({ brokerId }: { brokerId?: number }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [searchText, setSearchText] = useState('')

  const fetchAgents = async () => {
    if (!supabase) return
    setLoading(true)
    
    let query = supabase.from('agents').select('*')

    if (brokerId != null && !Number.isNaN(Number(brokerId)) && Number(brokerId) > 0) {
      const numericBrokerId = Number(brokerId)
      query = query.or(`broker_id.is.null,broker_id.eq.${numericBrokerId}`)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching agents:', error)
    } else {
      setAgents(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAgents()
  }, [brokerId])

  const handleCreate = () => {
    setEditingAgent(null)
    setOpenDialog(true)
  }

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent)
    setOpenDialog(true)
  }

  const handleDelete = async (agent: Agent) => {
    if (!supabase) return
    
    const confirmDelete = confirm(`Delete agent ${agent.name}? This action cannot be undone.`)
    if (!confirmDelete) return
    
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agent.id)
    
    if (error) {
      alert('Error deleting agent: ' + error.message)
    } else {
      alert('Agent deleted successfully!')
      fetchAgents()
    }
  }

  const handleStatusToggle = async (agent: Agent) => {
    if (!supabase) return
    
    const newStatus = agent.status === 'Active' ? 'Inactive' : 'Active'
    
    const { error } = await supabase
      .from('agents')
      .update({ status: newStatus })
      .eq('id', agent.id)
    
    if (error) {
      alert('Error updating status: ' + error.message)
    } else {
      fetchAgents()
    }
  }

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchText.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchText.toLowerCase()) ||
    (agent.phone || '').includes(searchText)
  )

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>Agent Management</h2>
          <p style={{ color: '#4b5563' }}>Manage your team members</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <Input
            placeholder="Search agents by name, email, or phone..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {agent.profile_photo ? (
                    <img src={agent.profile_photo} alt={agent.name} className="w-12 h-12 rounded-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>
                      {agent.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm" style={{ color: '#4b5563' }}>
                  <Mail className="w-4 h-4 mr-2" />
                  {agent.email}
                </div>
                {agent.phone && (
                  <div className="flex items-center text-sm" style={{ color: '#4b5563' }}>
                    <Phone className="w-4 h-4 mr-2" />
                    {agent.phone}
                  </div>
                )}
                {agent.license_number && (
                  <div className="text-sm" style={{ color: '#4b5563' }}>
                    License: {agent.license_number}
                  </div>
                )}
                {agent.specialization && (
                  <div className="text-sm" style={{ color: '#4b5563' }}>
                    {agent.specialization}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(agent)} className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleStatusToggle(agent)}
                  className="flex-1"
                >
                  {agent.status === 'Active' ? (
                    <><XCircle className="w-4 h-4 mr-1" />Deactivate</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-1" />Activate</>
                  )}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(agent)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <p style={{ color: '#9ca3af' }}>No agents found</p>
        </div>
      )}

      {openDialog && (
        <AgentDialog
          agent={editingAgent}
          brokerId={brokerId}
          isOpen={openDialog}
          onClose={() => {
            setOpenDialog(false)
            setEditingAgent(null)
            fetchAgents()
          }}
        />
      )}
    </div>
  )
}
