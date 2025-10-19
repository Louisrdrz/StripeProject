import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Routes protégées (seulement les API routes)
  const protectedApiRoutes = ['/api/generate', '/api/delete', '/api/create-subscription-checkout', '/api/create-portal-session']
  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route))

  // Pour les pages (comme /dashboard), on laisse passer et on gère côté client
  if (!isProtectedApiRoute) {
    return NextResponse.next()
  }

  // Vérifier l'authentification pour les API routes
  // Chercher le token dans plusieurs formats possibles
  const cookies = request.cookies
  let authToken = 
    cookies.get('sb-access-token')?.value ||
    cookies.get('supabase-auth-token')?.value ||
    cookies.get('sb-auth-token')?.value
  
  // Essayer aussi de trouver dans les cookies qui contiennent "access-token"
  if (!authToken) {
    const allCookies = cookies.getAll()
    const authCookie = allCookies.find(c => c.name.includes('access-token') || c.name.includes('auth-token'))
    authToken = authCookie?.value
  }
  
  if (!authToken) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  return NextResponse.next()
}

// TEMPORAIREMENT DÉSACTIVÉ POUR DEBUG
export const config = {
  matcher: [],
  // matcher: [
  //   '/api/generate/:path*',
  //   '/api/delete/:path*',
  //   '/api/create-subscription-checkout/:path*',
  //   '/api/create-portal-session/:path*',
  // ],
}

