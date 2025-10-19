import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client pour les opérations serveur avec service role
// Ne créer que côté serveur (où SUPABASE_SERVICE_KEY est disponible)
export const supabaseAdmin = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_KEY
  ? createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null as any

