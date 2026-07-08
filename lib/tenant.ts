'use client'

import { useState, useEffect } from 'react'
import { TenantSettings, TENANT_DEFAULTS } from './types/public'

/**
 * Client-side hook for reading tenantSettings from localStorage.
 * Returns defaults immediately (for SSR/hydration), then updates after mount.
 *
 * For Server Components use getTenantSettingsServer() from lib/tenantServer.ts instead.
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
