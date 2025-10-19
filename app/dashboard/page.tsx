'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import SubscriptionStatus from '@/components/SubscriptionStatus'
import ProjectGallery from '@/components/ProjectGallery'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

interface Subscription {
  id: string
  status: string
  quota_limit: number
  quota_used: number
  current_period_end: string
  stripe_price_id: string
}

interface Project {
  id: string
  created_at: string
  input_image_url: string
  output_image_url: string | null
  prompt: string
  status: string
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null) // URL de l'image en cours de transformation
  
  // Image de référence (optionnelle)
  const [referenceFile, setReferenceFile] = useState<File | null>(null)
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      // Charger l'abonnement
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .single()

      setSubscription(subData)

      // Charger les projets
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      setProjects(projectsData || [])
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setCurrentImageUrl(null) // Réinitialiser l'URL car c'est un nouveau fichier
    }
  }

  const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReferenceFile(file)
      setReferencePreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleGenerate = async () => {
    if ((!selectedFile && !currentImageUrl) || !prompt.trim()) {
      alert('Veuillez sélectionner une image et entrer un prompt')
      return
    }

    if (subscription && subscription.quota_used >= subscription.quota_limit) {
      alert('Quota atteint ! Passez au plan supérieur.')
      return
    }

    setGenerating(true)

    try {
      console.log('🎨 Début génération...')
      
      // Récupérer la session Supabase pour obtenir le token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('📝 Session récupérée:', !!session)
      console.log('📝 Access token présent:', !!session?.access_token)
      console.log('📝 Session error:', sessionError)
      
      if (!session?.access_token) {
        throw new Error('Session expirée, veuillez vous reconnecter')
      }

      console.log('✅ Token valide, envoi requête...')

      const formData = new FormData()
      
      // Si on a une URL d'image générée, l'envoyer au lieu du fichier
      if (currentImageUrl) {
        console.log('♻️ Transformation d\'une image générée précédemment')
        formData.append('imageUrl', currentImageUrl)
      } else if (selectedFile) {
        console.log('📤 Upload d\'une nouvelle image')
        formData.append('image', selectedFile)
      }
      
      // Ajouter l'image de référence si présente
      if (referenceFile) {
        console.log('📸 Image de référence ajoutée')
        formData.append('referenceImage', referenceFile)
      }
      
      formData.append('prompt', prompt)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData,
      })

      console.log('📡 Réponse API:', response.status)

      const data = await response.json()
      console.log('📦 Data reçue:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération')
      }

      // Afficher l'image générée à la place de l'image d'origine
      if (data.project?.output_image_url) {
        console.log('✅ Image générée avec succès!')
        console.log('📊 URL de sortie:', data.project.output_image_url)
        
        setPreviewUrl(data.project.output_image_url)
        setCurrentImageUrl(data.project.output_image_url) // Sauvegarder l'URL pour les transformations suivantes
        setSelectedFile(null) // Plus besoin du fichier original
        setReferenceFile(null) // Réinitialiser la référence pour la prochaine transformation
        setReferencePreviewUrl(null)
        
        const usedReference = referenceFile ? ' (avec image de référence)' : ''
        alert(`✅ Image générée avec succès${usedReference} ! Vous pouvez continuer à la transformer avec un nouveau prompt.`)
      } else {
        alert('Image générée avec succès !')
      }
      
      // Vider le prompt pour permettre une nouvelle transformation
      setPrompt('')
      
      // Recharger la galerie pour voir le projet dans l'historique
      loadData()
    } catch (error: any) {
      console.error('❌ Erreur complète:', error)
      alert(error.message || 'Une erreur est survenue')
    } finally {
      setGenerating(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      // Récupérer la session pour le token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Session expirée')
      }

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Erreur lors de la création de la session portal')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      // Récupérer la session pour le token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Session expirée')
      }

      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      // Mettre à jour localement
      setProjects(projects.filter(p => p.id !== projectId))
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-white rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="animate-spin h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-700">Chargement de votre espace...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold gradient-text mb-2">Dashboard</h1>
          <p className="text-lg text-gray-600">Gérez vos projets et créations IA</p>
        </div>

        {/* Statut de l'abonnement */}
        <div className="mb-8">
          <SubscriptionStatus
            subscription={subscription}
            onManage={handleManageSubscription}
          />
        </div>

        {/* Formulaire de génération */}
        <div className="card shadow-hard border-2 border-primary-100 mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-glow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Générer une nouvelle image</h2>
                <p className="text-sm text-gray-600">Créez ou transformez vos images avec l'IA</p>
              </div>
            </div>
            {currentImageUrl && (
              <button
                onClick={() => {
                  setSelectedFile(null)
                  setPreviewUrl(null)
                  setCurrentImageUrl(null)
                  setPrompt('')
                  setReferenceFile(null)
                  setReferencePreviewUrl(null)
                }}
                className="btn btn-outline text-sm"
                disabled={generating}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Nouvelle image
                </span>
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                Image à transformer
              </label>
              {!currentImageUrl ? (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    disabled={generating}
                  />
                </div>
              ) : (
                <div className="bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-200 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-primary-800">
                      Vous transformez l'image générée. Cliquez sur "Nouvelle image" pour recommencer.
                    </span>
                  </div>
                </div>
              )}
              {previewUrl && (
                <div className="mt-5">
                  <div className="relative inline-block">
                    <img
                      src={previewUrl}
                      alt="Aperçu"
                      className="max-w-md w-full rounded-2xl shadow-hard border-4 border-white"
                    />
                    {currentImageUrl && (
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Image générée - Continuez à transformer
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                Image de référence <span className="text-gray-500 font-normal">(optionnelle)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleReferenceFileChange}
                className="input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent-50 file:text-accent-700 hover:file:bg-accent-100"
                disabled={generating}
              />
              <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="leading-relaxed">
                  Ajoutez une image de référence pour guider le style de la transformation
                </span>
              </div>
              {referencePreviewUrl && (
                <div className="mt-4">
                  <div className="relative inline-block">
                    <img
                      src={referencePreviewUrl}
                      alt="Référence"
                      className="max-w-sm w-full rounded-2xl shadow-medium border-4 border-white"
                    />
                    <button
                      onClick={() => {
                        setReferenceFile(null)
                        setReferencePreviewUrl(null)
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-medium transition-all duration-300 hover:scale-110"
                      disabled={generating}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Image de référence chargée
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                Prompt de transformation
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="input min-h-32 resize-none"
                placeholder="Ex: add a dog in the background, add sunglasses, make it winter, change the shoes color to red..."
                disabled={generating}
              />
              <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="leading-relaxed">
                  <strong>Astuce :</strong> {referenceFile 
                    ? 'Décrivez comment utiliser le style de l\'image de référence (ex: "apply the style of the reference image", "use the colors from the reference")' 
                    : 'Soyez précis et détaillé dans votre description pour obtenir les meilleurs résultats'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleGenerate}
                disabled={generating || (!selectedFile && !currentImageUrl) || !prompt.trim() || (subscription && subscription.quota_used >= subscription.quota_limit)}
                className="btn btn-primary text-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Génération en cours...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Générer l'image avec l'IA
                  </span>
                )}
              </button>

              {subscription && subscription.quota_used >= subscription.quota_limit && (
                <div className="mt-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 p-4 rounded-xl">
                  <p className="text-red-800 font-semibold">
                    ⚠️ Quota atteint. <a href="/pricing" className="underline hover:text-red-900">Passez au plan supérieur</a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Galerie de projets */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-glow">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Mes projets</h2>
              <p className="text-sm text-gray-600">Historique de vos créations</p>
            </div>
          </div>
          <ProjectGallery projects={projects} onDelete={handleDeleteProject} />
        </div>
      </main>
    </div>
  )
}

