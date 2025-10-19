import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
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
    console.log('=== API create-subscription-checkout appelée ===')
    
    // Récupérer le token depuis le header Authorization
    const authHeader = request.headers.get('Authorization')
    console.log('Auth header présent:', !!authHeader)
    let token = authHeader?.replace('Bearer ', '')
    
    // Si pas dans le header, essayer les cookies (fallback)
    if (!token) {
      console.log('Pas de token dans header, vérification cookies...')
      const cookies = request.cookies
      token = cookies.get('sb-access-token')?.value
      console.log('Token dans cookies:', !!token)
    }
    
    if (!token) {
      console.log('❌ Aucun token trouvé')
      return NextResponse.json({ error: 'Non authentifié - token manquant' }, { status: 401 })
    }

    console.log('✅ Token trouvé, validation...')
    
    // Utiliser le client avec anon key pour valider le token utilisateur
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)

    if (authError) {
      console.error('❌ Erreur validation token:', authError.message)
      return NextResponse.json({ 
        error: 'Non authentifié - ' + authError.message 
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('❌ User null après validation')
      return NextResponse.json({ 
        error: 'Non authentifié - utilisateur invalide' 
      }, { status: 401 })
    }
    
    console.log('✅ User validé:', user.id)

    const { priceId } = await request.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID requis' }, { status: 400 })
    }

    // Vérifier si l'utilisateur a déjà un customer Stripe
    let { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = subscription?.stripe_customer_id

    // Créer un customer si nécessaire
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id
    }

    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      metadata: {
        user_id: user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Erreur création checkout:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne' },
      { status: 500 }
    )
  }
}

