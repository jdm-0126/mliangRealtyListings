// lib/tenantServer.ts
// Server-only helper — NO 'use client' directive.
// Safe to import from Server Components and Server Actions.

import { TenantSettings, TENANT_DEFAULTS } from './types/public'

/**
 * Returns hardcoded tenant defaults for use during SSR.
 * localStorage is not available server-side; client components
 * that need live settings use the useTenantSettings() hook in lib/tenant.ts.
 */
export function getTenantSettingsServer(): TenantSettings {
  return { ...TENANT_DEFAULTS }
}
