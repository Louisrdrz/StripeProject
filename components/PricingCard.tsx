'use client'

interface PricingCardProps {
  name: string
  price: number
  quota: number
  priceId: string
  features: string[]
  popular?: boolean
  onSubscribe: (priceId: string) => void
  loading?: boolean
}

export default function PricingCard({
  name,
  price,
  quota,
  priceId,
  features,
  popular = false,
  onSubscribe,
  loading = false,
}: PricingCardProps) {
  return (
    <div
      className={`card-hover relative overflow-hidden ${
        popular ? 'ring-2 ring-primary-400 shadow-glow-lg scale-105' : ''
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-glow">
            ⭐ Le plus populaire
          </div>
        </div>
      )}

      <div className={`absolute top-0 right-0 w-32 h-32 ${popular ? 'bg-gradient-to-br from-primary-100 to-accent-100' : 'bg-gradient-to-br from-gray-50 to-gray-100'} opacity-50 rounded-full blur-3xl -z-10`}></div>

      <div className="text-center mb-8 pt-2">
        <h3 className="text-3xl font-bold mb-4 text-gray-900">{name}</h3>
        <div className="flex items-baseline justify-center gap-2 mb-2">
          <span className="text-5xl font-extrabold gradient-text">{price}€</span>
          <span className="text-gray-500 font-medium">/mois</span>
        </div>
        <p className="text-primary-700 font-semibold bg-primary-50 inline-block px-4 py-2 rounded-xl">
          {quota} générations/mois
        </p>
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mt-0.5">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-gray-700 font-medium leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSubscribe(priceId)}
        disabled={loading}
        className={`w-full btn ${popular ? 'btn-primary' : 'btn-outline'} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Chargement...
          </span>
        ) : (
          `S'abonner maintenant`
        )}
      </button>
    </div>
  )
}

