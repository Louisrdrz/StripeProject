import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Récupère le token d'authentification depuis les cookies
 */
export function getAuthToken(request: NextRequest): string | null {
  const cookies = request.cookies
  
  // Essayer les noms de cookies courants
  let token = 
    cookies.get('sb-access-token')?.value ||
    cookies.get('supabase-auth-token')?.value ||
    cookies.get('sb-auth-token')?.value
  
  // Chercher dans tous les cookies si nécessaire
  if (!token) {
    const allCookies = cookies.getAll()
    const authCookie = allCookies.find(c => 
      c.name.includes('access-token') || 
      c.name.includes('auth-token') ||
      (c.name.startsWith('sb-') && c.name.includes('token'))
    )
    token = authCookie?.value
  }
  
  return token || null
}

/**
 * Vérifie l'authentification et retourne l'utilisateur
 */
export async function getCurrentUser(request: NextRequest) {
  const token = getAuthToken(request)
  
  if (!token) {
    return { user: null, error: 'Token manquant' }
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return { user: null, error: error?.message || 'Utilisateur invalide' }
  }
  
  return { user, error: null }
}

