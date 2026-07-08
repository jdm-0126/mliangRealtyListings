import { supabase } from '@/app/lib/supabaseClient.js'

const DEFAULT_TENANT_ID = '81b78be3-db0c-41f3-8f6f-e3989114eacf'
const DEFAULT_TABLE = 'mlianglistings'

function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Check the public Supabase environment variables.')
  }

  return supabase as NonNullable<typeof supabase>
}

export async function getTenantScopedClient() {
  const client = getSupabaseClient()

  return {
    supabase: client,
    tenantId: DEFAULT_TENANT_ID,
    listingsTable: DEFAULT_TABLE,
  }
}
