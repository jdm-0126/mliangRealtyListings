'use client'

import { useMaintenanceMode } from './MaintenanceEditBar'
import { Wrench } from 'lucide-react'

export default function MaintenanceBanner() {
  const on = useMaintenanceMode()
  if (!on) return null
  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-white"
      style={{ background: 'hsl(var(--primary))' }}>
      <Wrench className="w-3.5 h-3.5" />
      Maintenance Mode — click any listing's Edit button to update details
    </div>
  )
}
