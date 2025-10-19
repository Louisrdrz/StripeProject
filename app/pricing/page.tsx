'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import PricingCard from '@/components/PricingCard'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function PricingPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      router.push('/signup')
      return
    }

    setLoading(true)

    try {
      // Récupérer la session Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('Session:', session)
      console.log('Session error:', sessionError)
      
      if (!session?.access_token) {
        alert('Session expirée, veuillez vous reconnecter')
        router.push('/login')
        return
      }

      console.log('Envoi de la requête avec token...')

      const response = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()
      
      console.log('Réponse API:', response.status, data)

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL manquante dans la réponse')
      }
    } catch (error: any) {
      console.error('Erreur complète:', error)
      alert(error.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }

  const plans = [
    {
      name: 'Basic',
      price: 9,
      quota: 50,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC || 'price_basic',
      features: [
        '50 générations par mois',
        'Tous les modèles IA disponibles',
        'Stockage cloud illimité',
        'Support par email',
      ],
    },
    {
      name: 'Pro',
      price: 19,
      quota: 200,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || 'price_pro',
      features: [
        '200 générations par mois',
        'Tous les modèles IA disponibles',
        'Stockage cloud illimité',
        'Support prioritaire',
        'Accès aux nouveaux modèles en avant-première',
      ],
      popular: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-accent-100 rounded-full text-sm font-semibold text-primary-700 border border-primary-200">
              💎 Tarifs transparents et flexibles
            </span>
          </div>
          <h1 className="section-title">Choisissez votre plan</h1>
          <p className="text-xl md:text-2xl text-gray-600 mt-4">
            Commencez à créer des images exceptionnelles avec l'IA
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              {...plan}
              onSubscribe={handleSubscribe}
              loading={loading}
            />
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-gray-600 mb-4">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Annulez à tout moment</span>
          </div>
          <div className="inline-flex items-center gap-2 text-gray-600">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-medium">Paiement sécurisé par Stripe</span>
          </div>
        </div>
      </main>
    </div>
  )
}

