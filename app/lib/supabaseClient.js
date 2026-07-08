import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Default tenant — mliang is tenant 1
export const DEFAULT_TENANT_ID = 1

// Attach to window for browser extension (localhost only)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && supabase) {
  window.supabase = supabase
}

if (typeof window !== 'undefined' && !supabase) {
  console.error('Supabase client not initialized: Missing environment variables')
}
