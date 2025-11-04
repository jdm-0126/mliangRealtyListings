import { createClient } from '@supabase/supabase-js'

// ✅ Use public anon key (safe for browser)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
