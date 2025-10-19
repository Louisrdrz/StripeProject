import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  console.log('🔔 Webhook Stripe reçu!')
  console.log('🔐 STRIPE_WEBHOOK_SECRET défini:', !!webhookSecret)
  console.log('🔐 STRIPE_WEBHOOK_SECRET longueur:', webhookSecret?.length || 0)
  
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET n\'est pas défini dans les variables d\'environnement!')
    return NextResponse.json(
      { error: 'Configuration webhook manquante' },
      { status: 500 }
    )
  }
  
  try {
    const body = await request.text()
    console.log('📦 Body reçu, longueur:', body.length)
    
    const signature = request.headers.get('stripe-signature')
    console.log('🔑 Signature présente:', !!signature)

    if (!signature) {
      console.error('❌ Signature Stripe manquante dans les headers')
      return NextResponse.json(
        { error: 'Signature manquante' },
        { status: 400 }
      )
    }

    // Vérifier la signature du webhook
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ Signature vérifiée avec succès!')
    } catch (err: any) {
      console.error('❌ Erreur vérification signature:', err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    console.log('✅ Webhook reçu:', event.type)

    // Gérer les différents événements
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('📋 Traitement checkout.session.completed')
        const session = event.data.object as Stripe.Checkout.Session
        console.log('📋 Session mode:', session.mode)
        console.log('📋 Session metadata:', session.metadata)

        if (session.mode === 'subscription') {
          console.log('💳 Mode subscription détecté')
          
          // Récupérer les détails de l'abonnement
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          console.log('💳 Subscription récupérée:', subscription.id)

          const userId = session.metadata?.user_id
          console.log('👤 User ID depuis metadata:', userId)
          
          if (!userId) {
            console.error('❌ user_id manquant dans metadata!')
            console.error('❌ Metadata complet:', JSON.stringify(session.metadata))
            break
          }

          // Déterminer le quota selon le price ID
          const priceId = subscription.items.data[0].price.id
          console.log('💰 Price ID:', priceId)
          
          let quotaLimit = 50 // Par défaut Basic
          if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
            quotaLimit = 200
          }
          console.log('📊 Quota limit:', quotaLimit)

          // Créer ou mettre à jour l'abonnement dans Supabase
          const subscriptionData = {
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            quota_limit: quotaLimit,
            quota_used: 0,
            updated_at: new Date().toISOString(),
          }
          
          console.log('💾 Tentative d\'insertion dans Supabase:', subscriptionData)
          
          const { error, data } = await supabase.from('subscriptions').upsert(subscriptionData)

          if (error) {
            console.error('❌ Erreur création abonnement:', error)
            console.error('❌ Détails erreur:', JSON.stringify(error))
          } else {
            console.log('✅ Abonnement créé avec succès pour user:', userId)
            console.log('✅ Data retournée:', data)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Déterminer le quota selon le price ID
        const priceId = subscription.items.data[0].price.id
        let quotaLimit = 50
        if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
          quotaLimit = 200
        }

        // Mettre à jour l'abonnement
        const { error } = await supabase
          .from('subscriptions')
          .update({
            stripe_price_id: priceId,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            quota_limit: quotaLimit,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Erreur mise à jour abonnement:', error)
        } else {
          console.log('Abonnement mis à jour:', subscription.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Marquer l'abonnement comme annulé
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Erreur annulation abonnement:', error)
        } else {
          console.log('Abonnement annulé:', subscription.id)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        // Si c'est un renouvellement (pas la première facture)
        if (invoice.billing_reason === 'subscription_cycle') {
          const subscriptionId = invoice.subscription as string

          // Réinitialiser le quota pour le nouveau mois
          const { error } = await supabase
            .from('subscriptions')
            .update({
              quota_used: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId)

          if (error) {
            console.error('Erreur reset quota:', error)
          } else {
            console.log('Quota réinitialisé pour:', subscriptionId)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        // Marquer l'abonnement comme past_due
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId)

        if (error) {
          console.error('Erreur paiement échoué:', error)
        } else {
          console.log('Paiement échoué pour:', subscriptionId)
        }
        break
      }

      default:
        console.log('Événement non géré:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Erreur webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur interne' },
      { status: 500 }
    )
  }
}

