'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Header() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-soft sticky top-0 z-50 border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="group flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all duration-300 transform group-hover:scale-110">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold gradient-text">
              AI Studio
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-slow"></div>
                  <span className="text-sm font-medium text-gray-700">{user.email}</span>
                </div>
                <Link href="/dashboard" className="btn btn-outline text-sm">
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="btn btn-secondary text-sm">
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-primary-700 font-medium transition-colors">
                  Se connecter
                </Link>
                <Link href="/signup" className="btn btn-primary text-sm">
                  Commencer
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

