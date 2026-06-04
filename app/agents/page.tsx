'use client'

import AgentManagement from '@/components/AgentManagement'

export default function AgentsPage() {
  // In production, get brokerId from authentication
  // For now, pass undefined to show all agents
  const brokerId = 1 // Replace with actual broker ID from auth

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AgentManagement brokerId={brokerId} />
      </div>
    </div>
  )
}
