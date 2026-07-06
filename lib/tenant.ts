'use client'

import { useState, useEffect } from 'react'
import { TenantSettings, TENANT_DEFAULTS } from './types/public'

/**
 * Server-side: always returns hardcoded defaults.
 * localStorage is not available during SSR.
 * Client components that need live settings read from localStorage directly.
 */
export function getTenantSettingsServer(): TenantSettings {
  return { ...TENANT_DEFAULTS }
}

/**
 * Client-side hook for reading tenantSettings from localStorage.
 * Returns defaults immediately (for SSR/hydration), then updates after mount.
 */
export function useTenantSettings(): TenantSettings {
  const [settings, setSettings] = useState<TenantSettings>(TENANT_DEFAULTS)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tenantSettings')
      const parsed = JSON.parse(raw || '{}')
      setSettings({ ...TENANT_DEFAULTS, ...parsed })
    } catch {
      // JSON parse error or localStorage unavailable — keep defaults
    }
  }, [])

  return settings
}
