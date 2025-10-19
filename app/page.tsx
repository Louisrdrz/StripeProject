import Header from '@/components/Header'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-accent-100 rounded-full text-sm font-semibold text-primary-700 border border-primary-200">
              ✨ Propulsé par l'IA de nouvelle génération
            </span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-primary-900 to-gray-900 bg-clip-text text-transparent">
              Transformez vos images
            </span>
            <br />
            <span className="gradient-text">
              avec l'intelligence artificielle
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
            Créez, modifiez et transformez vos visuels en quelques secondes.<br />
            <span className="font-semibold text-primary-700">Rapide, simple et spectaculaire.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup" className="btn btn-primary text-lg px-10 py-4 w-full sm:w-auto">
              <span className="flex items-center gap-2">
                Commencer gratuitement
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link href="/pricing" className="btn btn-outline text-lg px-10 py-4 w-full sm:w-auto">
              Découvrir les offres
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-1">10K+</div>
              <div className="text-sm text-gray-600">Images générées</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-1">500+</div>
              <div className="text-sm text-gray-600">Utilisateurs actifs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-1">4.9/5</div>
              <div className="text-sm text-gray-600">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="section-title">Pourquoi nous choisir ?</h2>
            <p className="text-xl text-gray-600 mt-4">Des fonctionnalités pensées pour votre créativité</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-hover text-center group">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:shadow-glow-lg transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Ultra rapide</h3>
              <p className="text-gray-600 leading-relaxed">
                Générez vos images en quelques secondes grâce à nos modèles d'IA optimisés et notre infrastructure cloud performante
              </p>
            </div>

            <div className="card-hover text-center group">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:shadow-glow-lg transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">100% sécurisé</h3>
              <p className="text-gray-600 leading-relaxed">
                Vos données et images sont protégées avec un cryptage de niveau entreprise et un stockage cloud sécurisé
              </p>
            </div>

            <div className="card-hover text-center group">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:shadow-glow-lg transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Infiniment créatif</h3>
              <p className="text-gray-600 leading-relaxed">
                Des milliers de possibilités pour transformer, éditer et sublimer vos images selon votre imagination
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center">
          <div className="card max-w-3xl mx-auto bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white border-0 shadow-hard">
            <h2 className="text-4xl font-bold mb-4">Prêt à créer des merveilles ?</h2>
            <p className="text-xl mb-8 text-primary-100">
              Rejoignez des centaines de créateurs qui utilisent déjà notre plateforme
            </p>
            <Link href="/signup" className="inline-block px-10 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-medium">
              Commencer maintenant - C'est gratuit
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

