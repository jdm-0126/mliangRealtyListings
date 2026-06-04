'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/app/lib/supabaseClient.js'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Eye, 
  EyeOff,
  Calendar,
  Award
} from 'lucide-react'

interface SoldProperty {
  id: number
  property_id: number
  property_title: string
  property_location: string
  sale_price: number
  commission_amount: number
  commission_percentage: number
  date_sold: string
  date_commission_received: string
  agent_name: string
  broker_name: string
  status: 'Pending' | 'Paid' | 'Partial'
}

interface Agent {
  id: number
  name: string
  email: string
  phone: string
  total_sales: number
  active_listings: number
  status: string
}

export default function BrokerDashboard() {
  const [soldProperties, setSoldProperties] = useState<SoldProperty[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [showPropertyData, setShowPropertyData] = useState(true)
  const [loading, setLoading] = useState(true)
  const [totalCommission, setTotalCommission] = useState(0)
  const [pendingCommission, setPendingCommission] = useState(0)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    if (!supabase) return
    
    setLoading(true)

    // Fetch sold properties with commissions
    const { data: soldData, error: soldError } = await supabase
      .from('sold_properties')
      .select('*')
      .order('date_sold', { ascending: false })
    
    if (!soldError && soldData) {
      setSoldProperties(soldData)
      
      // Calculate totals
      const total = soldData.reduce((sum, prop) => 
        prop.status === 'Paid' ? sum + prop.commission_amount : sum, 0
      )
      const pending = soldData.reduce((sum, prop) => 
        prop.status === 'Pending' ? sum + prop.commission_amount : sum, 0
      )
      
      setTotalCommission(total)
      setPendingCommission(pending)
    }

    // Fetch agents
    const { data: agentsData, error: agentsError } = await supabase
      .from('brokers')
      .select('*')
      .eq('role', 'Agent')
      .eq('status', 'Active')
    
    if (!agentsError && agentsData) {
      setAgents(agentsData)
    }

    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Partial': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#000000' }}>Broker Dashboard</h1>
            <p style={{ color: '#4b5563' }}>Track your commissions and team performance</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowPropertyData(!showPropertyData)}
          >
            {showPropertyData ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Data
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Data
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium" style={{ color: '#4b5563' }}>Total Commission</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {showPropertyData ? formatCurrency(totalCommission) : '₱•••••••'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium" style={{ color: '#4b5563' }}>Pending Commission</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {showPropertyData ? formatCurrency(pendingCommission) : '₱•••••••'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium" style={{ color: '#4b5563' }}>Properties Sold</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {showPropertyData ? soldProperties.length : '••'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium" style={{ color: '#4b5563' }}>Active Agents</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {agents.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Your Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No active agents</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2" style={{ color: '#000000' }}>
                      {agent.name}
                    </h3>
                    <p className="text-sm mb-1" style={{ color: '#4b5563' }}>
                      {agent.email}
                    </p>
                    <p className="text-sm" style={{ color: '#4b5563' }}>
                      {agent.phone}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Recently Sold Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            {soldProperties.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No sold properties yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-medium" style={{ color: '#000000' }}>Property</th>
                      <th className="text-left p-3 text-sm font-medium" style={{ color: '#000000' }}>Agent</th>
                      <th className="text-left p-3 text-sm font-medium" style={{ color: '#000000' }}>Sale Price</th>
                      <th className="text-left p-3 text-sm font-medium" style={{ color: '#000000' }}>Commission</th>
                      <th className="text-left p-3 text-sm font-medium" style={{ color: '#000000' }}>Date Sold</th>
                      <th className="text-left p-3 text-sm font-medium" style={{ color: '#000000' }}>Date Received</th>
                      <th className="text-left p-3 text-sm font-medium" style={{ color: '#000000' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soldProperties.map((property) => (
                      <tr key={property.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium" style={{ color: '#000000' }}>
                              {showPropertyData ? property.property_title : '•••••••'}
                            </p>
                            <p className="text-sm" style={{ color: '#4b5563' }}>
                              {showPropertyData ? property.property_location : '•••••••'}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 text-sm" style={{ color: '#000000' }}>
                          {property.agent_name}
                        </td>
                        <td className="p-3 text-sm font-medium" style={{ color: '#000000' }}>
                          {showPropertyData ? formatCurrency(property.sale_price) : '₱•••••••'}
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-sm font-medium text-green-600">
                              {showPropertyData ? formatCurrency(property.commission_amount) : '₱•••••••'}
                            </p>
                            <p className="text-xs" style={{ color: '#4b5563' }}>
                              {showPropertyData ? `${property.commission_percentage}%` : '••%'}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 text-sm" style={{ color: '#000000' }}>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" style={{ color: '#4b5563' }} />
                            {formatDate(property.date_sold)}
                          </div>
                        </td>
                        <td className="p-3 text-sm" style={{ color: '#000000' }}>
                          {property.date_commission_received ? formatDate(property.date_commission_received) : '-'}
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(property.status)}>
                            {property.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
