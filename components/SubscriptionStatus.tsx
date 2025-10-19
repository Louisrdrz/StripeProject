'use client'

interface Subscription {
  id: string
  status: string
  quota_limit: number
  quota_used: number
  current_period_end: string
  stripe_price_id: string
}

interface SubscriptionStatusProps {
  subscription: Subscription | null
  onManage: () => void
}

export default function SubscriptionStatus({
  subscription,
  onManage,
}: SubscriptionStatusProps) {
  if (!subscription || subscription.status !== 'active') {
    return (
      <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-medium">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">Aucun abonnement actif</h3>
            <p className="text-yellow-800 mb-4">
              Souscrivez à un plan pour commencer à générer des images avec l'IA
            </p>
            <a href="/pricing" className="btn btn-primary text-sm">
              Découvrir les plans
            </a>
          </div>
        </div>
      </div>
    )
  }

  const planName = subscription.quota_limit === 50 ? 'Basic' : 'Pro'
  const remaining = subscription.quota_limit - subscription.quota_used
  const percentage = (subscription.quota_used / subscription.quota_limit) * 100

  return (
    <div className="card bg-gradient-to-br from-primary-50 to-accent-50 border-2 border-primary-200">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl font-bold gradient-text">Plan {planName}</h3>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Actif</span>
            </div>
            <p className="text-gray-600 font-medium">
              <span className="text-2xl font-bold text-primary-700">{subscription.quota_used}</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-lg">{subscription.quota_limit}</span>
              <span className="text-sm ml-1">générations utilisées</span>
            </p>
          </div>
        </div>
        <button onClick={onManage} className="btn btn-outline text-sm">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Gérer
          </span>
        </button>
      </div>

      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              percentage >= 80 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
              percentage >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
              'bg-gradient-to-r from-green-400 to-green-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 font-medium">{remaining} restantes</span>
          <span className="text-gray-500">{percentage.toFixed(0)}% utilisé</span>
        </div>
      </div>

      {remaining <= 5 && remaining > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 text-orange-800 p-4 rounded-xl text-sm mt-4 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold">Il vous reste seulement {remaining} génération{remaining > 1 ? 's' : ''} ce mois.</span>
        </div>
      )}

      {remaining === 0 && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-800 p-4 rounded-xl text-sm mt-4 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold mb-2">Quota atteint pour ce mois</p>
            <a href="/pricing" className="text-primary-700 hover:text-primary-800 font-bold underline">
              Passer au plan supérieur
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

