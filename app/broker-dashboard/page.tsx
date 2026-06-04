'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/app/lib/supabaseClient.js'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar,
  Award,
  Briefcase
} from 'lucide-react'

const SUPERADMIN_EMAIL = 'jn16h7@gmail.com'

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
  broker_id?: number | null
  name: string
  email: string
  phone?: string
  status: string
  license_number?: string
  profile_photo?: string
  bio?: string
  specialization?: string
  created_at?: string
}

export default function BrokerDashboard() {
  const router = useRouter()
  const [soldProperties, setSoldProperties] = useState<SoldProperty[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCommission, setTotalCommission] = useState(0)
  const [pendingCommission, setPendingCommission] = useState(0)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    // Check authentication
    const auth = sessionStorage.getItem('brokerAdminAuth')
    const userEmail = sessionStorage.getItem('userEmail')
    
    if (auth !== 'authenticated') {
      router.push('/')
      return
    }

    setIsSuperAdmin(userEmail === SUPERADMIN_EMAIL)
    
    const fetchDashboardData = async () => {
      if (!supabase) return

      setLoading(true)

      const [{ data: soldData, error: soldError }, { data: agentsData, error: agentsError }] = await Promise.all([
        supabase.from('sold_properties').select('*').order('date_sold', { ascending: false }),
        supabase.from('agents').select('*').eq('status', 'Active').order('created_at', { ascending: false }),
      ])

      if (!soldError && soldData) {
        setSoldProperties(soldData)

        const total = soldData.reduce((sum, prop) =>
          prop.status === 'Paid' ? sum + prop.commission_amount : sum, 0
        )
        const pending = soldData.reduce((sum, prop) =>
          prop.status === 'Pending' ? sum + prop.commission_amount : sum, 0
        )

        setTotalCommission(total)
        setPendingCommission(pending)
      }

      if (!agentsError && agentsData) {
        setAgents(agentsData)
      }

      setLoading(false)
    }

    void fetchDashboardData()
  }, [router])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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
            <p style={{ color: '#4b5563' }}>A quick overview of team activity, sold transactions, and broker priorities.</p>
          </div>

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
                    {formatCurrency(totalCommission)}
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
                    {formatCurrency(pendingCommission)}
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
                  <p className="text-sm font-medium" style={{ color: '#4b5563' }}>Sold Transactions</p>
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {soldProperties.length}
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
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => router.push(`/agent-profile?id=${agent.id}&email=${encodeURIComponent(agent.email)}`)}
                    className="w-full rounded-lg border border-gray-200 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {agent.profile_photo ? (
                        <Image src={agent.profile_photo} alt={agent.name} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                          <Users className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold" style={{ color: '#000000' }}>{agent.name}</h3>
                        <p className="text-xs text-blue-600">Open profile</p>
                      </div>
                    </div>
                    <p className="text-sm mb-1" style={{ color: '#4b5563' }}>{agent.email}</p>
                    <p className="text-sm" style={{ color: '#4b5563' }}>{agent.phone || 'No phone on file'}</p>
                    {agent.specialization && (
                      <p className="mt-2 text-xs text-gray-500">{agent.specialization}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Overview Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700">What the broker sees at a glance</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> {soldProperties.length} sold transactions tracked</li>
                  <li className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" /> {agents.length} active agents on the team</li>
                  <li className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> {formatCurrency(totalCommission)} in paid commissions</li>
                  <li className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-amber-500" /> {formatCurrency(pendingCommission)} still pending follow-up</li>
                </ul>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">Next step</p>
                <p className="mt-2 text-sm text-blue-800">
                  Use the agent cards above to open each profile directly. This overview is intentionally focused on team activity and transaction health rather than long property lists.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
