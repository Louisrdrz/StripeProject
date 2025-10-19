import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Client pour valider les tokens utilisateurs
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Client admin pour les opérations sur la base de données
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [Portal] Début création session portal')
    
    // Récupérer le token depuis le header Authorization
    const authHeader = request.headers.get('Authorization')
    let token = authHeader?.replace('Bearer ', '')
    
    // Si pas dans le header, essayer les cookies (fallback)
    if (!token) {
      const cookies = request.cookies
      token = cookies.get('sb-access-token')?.value
    }
    
    if (!token) {
      console.log('❌ [Portal] Token manquant')
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    console.log('✅ [Portal] Token présent')

    // Utiliser le client avec anon key pour valider le token utilisateur
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)

    if (authError || !user) {
      console.log('❌ [Portal] Erreur auth:', authError?.message)
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    console.log('✅ [Portal] User ID:', user.id)

    // Récupérer le customer ID avec le client admin
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    console.log('📊 [Portal] Subscription:', subscription)
    console.log('📊 [Portal] Sub Error:', subError)

    if (!subscription?.stripe_customer_id) {
      console.log('❌ [Portal] Pas de customer ID trouvé')
      return NextResponse.json(
        { error: 'Aucun abonnement trouvé' },
        { status: 404 }
      )
    }

    console.log('✅ [Portal] Customer ID:', subscription.stripe_customer_id)
    console.log('🔗 [Portal] Return URL:', `${process.env.NEXT_PUBLIC_URL}/dashboard`)

    // Créer une session portal
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
    })

    console.log('✅ [Portal] Session créée:', session.url)

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('❌ [Portal] Erreur création portal:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne' },
      { status: 500 }
    )
  }
}

