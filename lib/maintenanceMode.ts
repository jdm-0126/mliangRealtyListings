// lib/maintenanceMode.ts
export const MAINTENANCE_KEY = 'maintenanceMode'

export function isMaintenanceMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(MAINTENANCE_KEY) === 'true'
}

export function setMaintenanceMode(on: boolean) {
  if (typeof window === 'undefined') return
  if (on) localStorage.setItem(MAINTENANCE_KEY, 'true')
  else localStorage.removeItem(MAINTENANCE_KEY)
  window.dispatchEvent(new Event('maintenanceModeChange'))
}
